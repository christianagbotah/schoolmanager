import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoice = await db.invoice.findUnique({
      where: { invoice_id: parseInt(id) },
      include: {
        student: {
          select: { student_id: true, name: true, first_name: true, last_name: true, student_code: true, phone: true, parent_id: true },
        },
        payments: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const invoice = await db.invoice.update({
      where: { invoice_id: parseInt(id) },
      data: {
        title: body.title,
        description: body.description,
        amount: body.amount,
        discount: body.discount || 0,
        due: (body.amount || 0) - (body.amount_paid || 0) - (body.discount || 0),
        status: body.status,
        year: body.year,
        term: body.term,
      },
    });
    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.payment.deleteMany({ where: { invoice_id: parseInt(id) } });
    await db.invoice.delete({ where: { invoice_id: parseInt(id) } });
    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
