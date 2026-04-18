import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { installmentId, amount, paymentMethod, reference } = body;

    if (!installmentId) {
      return NextResponse.json({ error: 'Installment ID is required' }, { status: 400 });
    }
    if (!amount || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Valid payment amount is required' }, { status: 400 });
    }

    // Find the installment
    const installment = await db.payment_installments.findUnique({
      where: { installment_id: parseInt(installmentId) },
      include: {
        payment_plan: true,
        student: {
          select: { student_id: true, name: true, student_code: true, class_id: true },
        },
      },
    });

    if (!installment) {
      return NextResponse.json({ error: 'Installment not found' }, { status: 404 });
    }

    const paymentAmount = parseFloat(amount);
    const remaining = installment.amount - installment.paid_amount;

    if (paymentAmount > remaining + 0.01) {
      return NextResponse.json(
        { error: `Amount exceeds remaining balance of ${remaining.toFixed(2)}` },
        { status: 400 }
      );
    }

    const newPaidAmount = installment.paid_amount + paymentAmount;
    const isFullPayment = newPaidAmount >= installment.amount - 0.01;
    const newStatus = isFullPayment ? 'paid' : 'partial';

    // Update installment
    const updatedInstallment = await db.payment_installments.update({
      where: { installment_id: parseInt(installmentId) },
      data: {
        paid_amount: newPaidAmount,
        status: newStatus,
        payment_date: isFullPayment ? new Date() : (installment.payment_date || null),
        payment_method: paymentMethod || 'cash',
      },
    });

    // Calculate new plan totals
    const allInstallments = await db.payment_installments.findMany({
      where: { payment_plan_id: installment.payment_plan_id },
    });

    const totalPaid = allInstallments.reduce((s, i) => s + i.paid_amount, 0);
    const allPaid = allInstallments.every((i) => i.status === 'paid');
    const planTotal = allInstallments.reduce((s, i) => s + i.amount, 0);

    const planStatus = allPaid ? 'completed' : 'active';

    // Update plan
    await db.payment_plans.update({
      where: { payment_plan_id: installment.payment_plan_id },
      data: {
        paid_amount: totalPaid,
        status: planStatus,
        end_date: allPaid ? new Date() : undefined,
      },
    });

    // Create a payment record if student exists
    let receiptCode = '';
    if (installment.student) {
      const now = new Date();
      const code = `RCP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(installment.student.student_id).padStart(4, '0')}`;

      const payment = await db.payment.create({
        data: {
          student_id: installment.student.student_id,
          invoice_id: installment.invoice_id,
          receipt_code: code,
          invoice_code: installment.invoice_id ? `INV-${installment.invoice_id}` : '',
          title: `${installment.payment_plan?.name || 'Payment'} - Installment #${installment.installment_number}`,
          amount: paymentAmount,
          due: 0,
          payment_type: 'installment',
          payment_method: paymentMethod || 'cash',
          year: new Date().getFullYear().toString(),
          term: 'Term 1',
          timestamp: new Date(),
          approval_status: 'approved',
        },
      });

      // Create receipt
      await db.receipts.create({
        data: {
          receipt_number: code,
          student_id: installment.student.student_id,
          payment_id: payment.payment_id,
          amount: paymentAmount,
          payment_method: paymentMethod || 'cash',
          generated_at: new Date(),
          generated_by: 'admin',
        },
      });

      receiptCode = code;
    }

    return NextResponse.json({
      installment: updatedInstallment,
      planStatus,
      receiptCode,
      message: `Payment of ${paymentAmount.toFixed(2)} recorded successfully${receiptCode ? `. Receipt: ${receiptCode}` : ''}`,
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}
