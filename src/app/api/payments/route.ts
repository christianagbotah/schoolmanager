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

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { receipt_code: { contains: search } },
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
      db.payment.aggregate({
        _sum: { amount: true },
      }),
    ]);

    // Today's collections
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
    const monthEnd = new Date(todayStart.getFullYear(), todayStart.getMonth() + 1, 0, 23, 59, 59, 999);

    const [todayTotal, monthTotal] = await Promise.all([
      db.payment.aggregate({
        where: { timestamp: { gte: todayStart, lte: todayEnd } },
        _sum: { amount: true },
      }),
      db.payment.aggregate({
        where: { timestamp: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
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
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, invoiceId, amount, paymentMethod, year, term } = body;

    if (!studentId || !amount || !paymentMethod) {
      return NextResponse.json({ error: 'Student, amount, and payment method are required' }, { status: 400 });
    }

    const student = await db.student.findUnique({ where: { student_id: studentId } });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    let invoice = null;
    if (invoiceId) {
      invoice = await db.invoice.findUnique({ where: { invoice_id: invoiceId } });
    }

    const receiptCode = `RCP-${String(Date.now()).slice(-6)}`;
    const invoiceCode = invoice?.invoice_code || '';

    const payment = await db.payment.create({
      data: {
        student_id: studentId,
        invoice_id: invoiceId || null,
        invoice_code: invoiceCode,
        receipt_code: receiptCode,
        title: invoice?.title || 'Payment',
        amount,
        due: invoice ? invoice.due - amount : 0,
        payment_type: 'invoice',
        payment_method: paymentMethod,
        year: year || invoice?.year || '',
        term: term || invoice?.term || '',
        timestamp: new Date(),
        approval_status: 'approved',
      },
    });

    // Update invoice if linked
    if (invoice) {
      const newAmountPaid = invoice.amount_paid + amount;
      const newDue = invoice.amount - newAmountPaid - invoice.discount;
      await db.invoice.update({
        where: { invoice_id: invoiceId },
        data: {
          amount_paid: newAmountPaid,
          due: Math.max(0, newDue),
          status: newDue <= 0 ? 'paid' : 'partial',
          payment_timestamp: newDue <= 0 ? new Date() : null,
          method: paymentMethod,
        },
      });
    }

    // Create receipt
    await db.receipts.create({
      data: {
        receipt_number: receiptCode,
        student_id: studentId,
        parent_id: student.parent_id,
        invoice_code: invoiceCode,
        payment_id: payment.payment_id,
        amount,
        payment_method: paymentMethod,
        receipt_type: 'invoice',
        generated_at: new Date(),
        generated_by: 'System',
      },
    });

    return NextResponse.json({ payment, receiptCode, message: 'Payment recorded successfully' });
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}
