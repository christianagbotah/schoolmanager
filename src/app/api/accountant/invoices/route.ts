import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const classId = searchParams.get('classId') || '';
    const status = searchParams.get('status') || '';
    const year = searchParams.get('year') || '';
    const term = searchParams.get('term') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { invoice_code: { contains: search } },
        { title: { contains: search } },
        { student: { OR: [
          { name: { contains: search } },
          { student_code: { contains: search } },
        ]}},
      ];
    }
    if (classId) where.class_id = parseInt(classId);
    if (status) where.status = status;
    if (year) where.year = year;
    if (term) where.term = term;

    const [invoices, total, summary] = await Promise.all([
      db.invoice.findMany({
        where,
        include: {
          student: { select: { student_id: true, name: true, first_name: true, last_name: true, student_code: true } },
          class: { select: { name: true } },
        },
        orderBy: { creation_timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.invoice.count({ where }),
      db.invoice.aggregate({
        _sum: { amount: true, amount_paid: true, due: true },
      }),
    ]);

    const statusCounts = await Promise.all([
      db.invoice.count({ where: { status: 'paid' } }),
      db.invoice.count({ where: { status: 'partial' } }),
      db.invoice.count({ where: { status: 'unpaid' } }),
    ]);

    return NextResponse.json({
      invoices,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      summary: {
        totalBilled: summary._sum.amount || 0,
        totalCollected: summary._sum.amount_paid || 0,
        outstanding: summary._sum.due || 0,
      },
      stats: { paid: statusCounts[0], partial: statusCounts[1], unpaid: statusCounts[2] },
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentIds, items, year, term, classId, className } = body;

    if (!studentIds || studentIds.length === 0) {
      return NextResponse.json({ error: 'At least one student is required' }, { status: 400 });
    }
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'At least one billing item is required' }, { status: 400 });
    }

    const totalAmount = items.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0);

    // Get last invoice code and increment
    const lastInvoice = await db.invoice.findFirst({
      orderBy: { invoice_code: 'desc' },
      select: { invoice_code: true },
    });

    let nextCode = 100001;
    if (lastInvoice?.invoice_code) {
      const num = parseInt(lastInvoice.invoice_code.replace(/\D/g, ''));
      if (!isNaN(num)) nextCode = num + 1;
    }

    const results = [];
    for (const studentId of studentIds) {
      const invoiceCode = String(nextCode + results.length);
      const invoice = await db.invoice.create({
        data: {
          student_id: studentId,
          title: items.map((i: { title: string }) => i.title).join(', '),
          description: items.map((i: { title: string; amount: number }) => `${i.title}: GHS ${i.amount}`).join('; '),
          amount: totalAmount,
          amount_paid: 0,
          due: totalAmount,
          discount: 0,
          creation_timestamp: new Date(),
          status: 'unpaid',
          year,
          term,
          class_id: classId || null,
          invoice_code: invoiceCode,
          class_name: className || '',
        },
      });
      results.push(invoice);
    }

    return NextResponse.json({ invoices: results, message: `${results.length} invoice(s) created successfully` });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
