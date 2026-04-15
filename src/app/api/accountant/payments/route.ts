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
        { title: { contains: search } },
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

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [payments, total, todayAgg, monthAgg, totalAgg] = await Promise.all([
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
        where: { timestamp: { gte: todayStart } },
        _sum: { amount: true },
        _count: true,
      }),
      db.payment.aggregate({
        where: { timestamp: { gte: monthStart } },
        _sum: { amount: true },
        _count: true,
      }),
      db.payment.aggregate({
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    // Students with outstanding invoices (for payment form)
    const owingStudents = await db.invoice.findMany({
      where: { due: { gt: 0 } },
      select: {
        student_id: true,
        student: { select: { student_id: true, name: true, student_code: true } },
        class: { select: { name: true } },
        invoice_id: true,
        invoice_code: true,
        title: true,
        amount: true,
        amount_paid: true,
        due: true,
        year: true,
        term: true,
      },
      distinct: ['student_id'],
      orderBy: { due: 'desc' },
      take: 100,
    });

    // Payment method breakdown
    const methodBreakdown = await db.payment.groupBy({
      by: ['payment_method'],
      _sum: { amount: true },
      _count: true,
    });

    return NextResponse.json({
      payments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      summary: {
        totalCollected: totalAgg._sum.amount || 0,
        totalCount: totalAgg._count || 0,
        todayTotal: todayAgg._sum.amount || 0,
        todayCount: todayAgg._count || 0,
        monthTotal: monthAgg._sum.amount || 0,
        monthCount: monthAgg._count || 0,
      },
      owingStudents,
      methodBreakdown: methodBreakdown.map(m => ({
        method: m.payment_method,
        amount: m._sum.amount || 0,
        count: m._count || 0,
      })),
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

    const student = await db.student.findUnique({
      where: { student_id: studentId },
      select: { student_id: true, parent_id: true, name: true },
    });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    let invoice: { invoice_code: string; title: string; due: number; amount_paid: number; amount: number; discount: number; year: string; term: string } | null = null;
    if (invoiceId) {
      invoice = await db.invoice.findUnique({ where: { invoice_id: invoiceId } });
    }

    // Generate sequential receipt code
    const lastPayment = await db.payment.findFirst({
      orderBy: { payment_id: 'desc' },
      select: { receipt_code: true },
    });

    let receiptCode = '100001';
    if (lastPayment?.receipt_code) {
      const num = parseInt(lastPayment.receipt_code.replace(/\D/g, ''));
      if (!isNaN(num)) receiptCode = String(num + 1);
    }

    const invoiceCode = invoice?.invoice_code || '';

    const payment = await db.payment.create({
      data: {
        student_id: studentId,
        invoice_id: invoiceId || null,
        invoice_code: invoiceCode,
        receipt_code: receiptCode,
        title: invoice?.title || 'Payment',
        amount: parseFloat(amount),
        due: invoice ? Math.max(0, invoice.due - parseFloat(amount)) : 0,
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
      const newAmountPaid = invoice.amount_paid + parseFloat(amount);
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
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        receipt_type: 'invoice',
        generated_at: new Date(),
        generated_by: 'Accountant',
      },
    });

    return NextResponse.json({ payment, receiptCode, message: 'Payment recorded successfully' });
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}
