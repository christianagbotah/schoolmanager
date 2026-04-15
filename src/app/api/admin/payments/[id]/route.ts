import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payment = await db.payment.findUnique({
      where: { payment_id: parseInt(id) },
      include: {
        student: true,
        invoice: true,
      },
    });
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payment = await db.payment.findUnique({
      where: { payment_id: parseInt(id) },
    });
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Reverse the payment on the invoice
    if (payment.invoice_id) {
      const invoice = await db.invoice.findUnique({ where: { invoice_id: payment.invoice_id } });
      if (invoice) {
        const newAmountPaid = Math.max(0, invoice.amount_paid - payment.amount);
        const newDue = invoice.amount - newAmountPaid - invoice.discount;
        await db.invoice.update({
          where: { invoice_id: payment.invoice_id },
          data: {
            amount_paid: newAmountPaid,
            due: Math.max(0, newDue),
            status: newDue <= 0 ? 'paid' : newAmountPaid > 0 ? 'partial' : 'unpaid',
          },
        });
      }
    }

    await db.receipts.deleteMany({ where: { payment_id: parseInt(id) } });
    await db.payment.delete({ where: { payment_id: parseInt(id) } });

    return NextResponse.json({ message: 'Payment deleted and invoice updated' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 });
  }
}
