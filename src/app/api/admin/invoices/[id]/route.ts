import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoice = await db.invoice.findUnique({
      where: { invoice_id: parseInt(id) },
      include: {
        student: {
          select: { student_id: true, name: true, first_name: true, middle_name: true, last_name: true, student_code: true, phone: true, parent_id: true, sex: true },
        },
        class: { select: { class_id: true, name: true, name_numeric: true, category: true } },
        payments: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Get enrollment info for student
    const enrollment = await db.enroll.findFirst({
      where: { student_id: invoice.student_id, year: invoice.year, mute: 0 },
      include: {
        class: { select: { name: true, name_numeric: true } },
        section: { select: { name: true } },
      },
      orderBy: { enroll_id: 'desc' },
    });

    return NextResponse.json({ ...invoice, enrollment });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await db.invoice.findUnique({ where: { invoice_id: parseInt(id) } });
    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const newAmount = body.amount !== undefined ? body.amount : existing.amount;
    const newDiscount = body.discount !== undefined ? body.discount : existing.discount;
    const newAmountPaid = body.amount_paid !== undefined ? body.amount_paid : existing.amount_paid;
    const newDue = newAmount - newAmountPaid - newDiscount;

    const invoice = await db.invoice.update({
      where: { invoice_id: parseInt(id) },
      data: {
        title: body.title !== undefined ? body.title : undefined,
        description: body.description !== undefined ? body.description : undefined,
        amount: newAmount,
        amount_paid: newAmountPaid,
        discount: newDiscount,
        due: Math.max(0, newDue),
        status: body.status !== undefined ? body.status : (newDue <= 0 ? 'paid' : newAmountPaid > 0 ? 'partial' : 'unpaid'),
        year: body.year !== undefined ? body.year : undefined,
        term: body.term !== undefined ? body.term : undefined,
        class_name: body.class_name !== undefined ? body.class_name : undefined,
      },
    });

    return NextResponse.json({ invoice, message: 'Invoice updated successfully' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoice = await db.invoice.findUnique({ where: { invoice_id: parseInt(id) } });
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    await db.payment.deleteMany({ where: { invoice_id: parseInt(id) } });
    await db.receipts.deleteMany({ where: { invoice_code: invoice.invoice_code } });
    await db.invoice.delete({ where: { invoice_id: parseInt(id) } });

    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
