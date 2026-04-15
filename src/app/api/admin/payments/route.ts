import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const method = searchParams.get('method') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const year = searchParams.get('year') || '';
    const term = searchParams.get('term') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const action = searchParams.get('action') || '';

    // Stats
    if (action === 'stats') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
      const monthEnd = new Date(todayStart.getFullYear(), todayStart.getMonth() + 1, 0, 23, 59, 59, 999);

      const [totalCount, totalCollected, todayTotal, monthTotal, cashTotal, momoTotal, chequeTotal] = await Promise.all([
        db.payment.count(),
        db.payment.aggregate({ _sum: { amount: true } }),
        db.payment.aggregate({ where: { timestamp: { gte: todayStart, lte: todayEnd } }, _sum: { amount: true } }),
        db.payment.aggregate({ where: { timestamp: { gte: monthStart, lte: monthEnd } }, _sum: { amount: true } }),
        db.payment.aggregate({ where: { payment_method: 'cash' }, _sum: { amount: true } }),
        db.payment.aggregate({ where: { payment_method: 'mobile_money' }, _sum: { amount: true } }),
        db.payment.aggregate({ where: { payment_method: 'cheque' }, _sum: { amount: true } }),
      ]);

      return NextResponse.json({
        stats: {
          total: totalCount,
          totalCollected: totalCollected._sum.amount || 0,
          todayTotal: todayTotal._sum.amount || 0,
          monthTotal: monthTotal._sum.amount || 0,
          byMethod: {
            cash: cashTotal._sum.amount || 0,
            mobile_money: momoTotal._sum.amount || 0,
            cheque: chequeTotal._sum.amount || 0,
          },
        },
      });
    }

    // Payment history
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { receipt_code: { contains: search } },
        { invoice_code: { contains: search } },
        { student: { OR: [
          { name: { contains: search } },
          { student_code: { contains: search } },
        ]}},
      ];
    }
    if (method) where.payment_method = method;
    if (year) where.year = year;
    if (term) where.term = term;
    if (startDate && endDate) {
      where.timestamp = { gte: new Date(startDate), lte: new Date(endDate) };
    } else if (startDate) {
      where.timestamp = { gte: new Date(startDate) };
    } else if (endDate) {
      where.timestamp = { lte: new Date(endDate) };
    }

    const [payments, total, summary] = await Promise.all([
      db.payment.findMany({
        where,
        include: {
          student: { select: { student_id: true, name: true, student_code: true } },
          invoice: { select: { invoice_code: true, title: true } },
        },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.payment.count({ where }),
      db.payment.aggregate({ where, _sum: { amount: true } }),
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
    const monthEnd = new Date(todayStart.getFullYear(), todayStart.getMonth() + 1, 0, 23, 59, 59, 999);

    const [todayTotal, monthTotal] = await Promise.all([
      db.payment.aggregate({ where: { timestamp: { gte: todayStart, lte: todayEnd } }, _sum: { amount: true } }),
      db.payment.aggregate({ where: { timestamp: { gte: monthStart, lte: monthEnd } }, _sum: { amount: true } }),
    ]);

    return NextResponse.json({
      payments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      summary: {
        totalCollected: summary._sum.amount || 0,
        todayTotal: todayTotal._sum.amount || 0,
        monthTotal: monthTotal._sum.amount || 0,
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Take payment (matching CI3 take_payment)
    const { studentId, amount, paymentMethod, receiptCode, year, term, classId, printReceipt } = body;

    if (!studentId || !amount || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Student and a valid amount are required' }, { status: 400 });
    }

    const student = await db.student.findUnique({ where: { student_id: studentId } });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Find all unpaid invoices for this student
    const unpaidInvoices = await db.invoice.findMany({
      where: {
        student_id: studentId,
        due: { gt: 0 },
        can_delete: { not: 'trash' },
      },
      orderBy: { creation_timestamp: 'asc' },
    });

    if (unpaidInvoices.length === 0) {
      return NextResponse.json({ error: 'No outstanding invoices found for this student' }, { status: 400 });
    }

    const paymentAmount = parseFloat(amount);
    let remaining = paymentAmount;
    const updatedInvoices: any[] = [];
    const paymentRecords: any[] = [];

    // Distribute payment across invoices (oldest first, matching CI3 logic)
    for (const invoice of unpaidInvoices) {
      if (remaining <= 0) break;

      const payable = Math.min(remaining, invoice.due);
      const rcptCode = receiptCode || `RCP-${String(Date.now()).slice(-6)}`;

      // Create payment record
      const payment = await db.payment.create({
        data: {
          student_id: studentId,
          invoice_id: invoice.invoice_id,
          invoice_code: invoice.invoice_code,
          receipt_code: rcptCode,
          title: invoice.title,
          amount: payable,
          due: invoice.due - payable,
          payment_type: 'invoice',
          payment_method: paymentMethod || 'cash',
          year: year || invoice.year || '',
          term: term || invoice.term || '',
          timestamp: new Date(),
          approval_status: 'approved',
          can_delete: '',
        },
      });

      paymentRecords.push(payment);

      // Update invoice
      const newAmountPaid = invoice.amount_paid + payable;
      const newDue = invoice.amount - newAmountPaid - invoice.discount;
      const newStatus = newDue <= 0 ? 'paid' : 'partial';

      const updatedInvoice = await db.invoice.update({
        where: { invoice_id: invoice.invoice_id },
        data: {
          amount_paid: newAmountPaid,
          due: Math.max(0, newDue),
          status: newStatus,
          payment_timestamp: newDue <= 0 ? new Date() : null,
          method: paymentMethod || 'cash',
        },
      });

      updatedInvoices.push(updatedInvoice);
      remaining -= payable;
    }

    // Create receipt records
    const mainRcptCode = receiptCode || paymentRecords[0]?.receipt_code || `RCP-${String(Date.now()).slice(-6)}`;
    for (const payment of paymentRecords) {
      await db.receipts.create({
        data: {
          receipt_number: mainRcptCode,
          student_id: studentId,
          parent_id: student.parent_id,
          invoice_code: payment.invoice_code,
          payment_id: payment.payment_id,
          amount: payment.amount,
          payment_method: paymentMethod || 'cash',
          receipt_type: 'invoice',
          generated_at: new Date(),
          generated_by: 'System',
        },
      });
    }

    return NextResponse.json({
      payments: paymentRecords,
      invoices: updatedInvoices,
      receiptCode: mainRcptCode,
      printReceipt: printReceipt !== false,
      change: remaining > 0 ? remaining : 0,
      message: `Payment of ${paymentAmount} recorded successfully${remaining > 0 ? `. Change: ${remaining.toFixed(2)}` : ''}`,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}
