import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const plan = await db.payment_plans.findUnique({
      where: { payment_plan_id: parseInt(id) },
      include: {
        student: {
          select: { student_id: true, name: true, student_code: true },
        },
        fee_structure: {
          select: { fee_structure_id: true, name: true, year: true, term: true, total_amount: true },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Payment plan not found' }, { status: 404 });
    }

    const installments = await db.payment_installments.findMany({
      where: { payment_plan_id: parseInt(id) },
      include: {
        student: {
          select: { student_id: true, name: true, student_code: true },
        },
        invoice: {
          select: { invoice_id: true, invoice_code: true, amount: true, status: string },
        },
      },
      orderBy: { installment_number: 'asc' },
    });

    // Mark overdue installments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueToMark = installments.filter(
      (i) => i.status === 'pending' && i.due_date && new Date(i.due_date) < today
    );
    if (overdueToMark.length > 0) {
      await db.payment_installments.updateMany({
        where: { installment_id: { in: overdueToMark.map((i) => i.installment_id) } },
        data: { status: 'overdue' },
      });
      // Refresh installments
      for (const inst of installments) {
        if (overdueToMark.find((o) => o.installment_id === inst.installment_id)) {
          inst.status = 'overdue';
        }
      }
    }

    const totalAmount = installments.reduce((s, i) => s + i.amount, 0);
    const paidAmount = installments.reduce((s, i) => s + i.paid_amount, 0);
    const pendingCount = installments.filter((i) => i.status === 'pending').length;
    const paidCount = installments.filter((i) => i.status === 'paid').length;
    const overdueCount = installments.filter((i) => i.status === 'overdue').length;
    const partialCount = installments.filter((i) => i.status === 'partial').length;

    const progress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

    // Check if plan should be auto-completed
    let planStatus = plan.status;
    if (paidCount === installments.length && installments.length > 0) {
      planStatus = 'completed';
      await db.payment_plans.update({
        where: { payment_plan_id: parseInt(id) },
        data: { status: 'completed', paid_amount: paidAmount },
      });
    }

    return NextResponse.json({
      plan: { ...plan, status: planStatus, paid_amount: paidAmount },
      installments,
      stats: {
        totalAmount,
        paidAmount,
        remaining: totalAmount - paidAmount,
        totalInstallments: installments.length,
        pendingCount,
        paidCount,
        overdueCount,
        partialCount,
        progress,
      },
    });
  } catch (error) {
    console.error('Error fetching payment plan:', error);
    return NextResponse.json({ error: 'Failed to fetch payment plan' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description, numberOfPayments, frequency, isActive, status } = body;

    const existing = await db.payment_plans.findUnique({
      where: { payment_plan_id: parseInt(id) },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Payment plan not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (numberOfPayments !== undefined) data.number_of_payments = parseInt(numberOfPayments);
    if (frequency !== undefined) data.frequency = frequency;
    if (isActive !== undefined) data.is_active = isActive ? 1 : 0;
    if (status !== undefined) data.status = status;

    const plan = await db.payment_plans.update({
      where: { payment_plan_id: parseInt(id) },
      data,
    });

    return NextResponse.json({ plan, message: 'Payment plan updated successfully' });
  } catch (error) {
    console.error('Error updating payment plan:', error);
    return NextResponse.json({ error: 'Failed to update payment plan' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.payment_plans.update({
      where: { payment_plan_id: parseInt(id) },
      data: { is_active: 0, status: 'cancelled' },
    });

    return NextResponse.json({ message: 'Payment plan cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling payment plan:', error);
    return NextResponse.json({ error: 'Failed to cancel payment plan' }, { status: 500 });
  }
}
