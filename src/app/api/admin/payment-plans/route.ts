import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';
    const isActive = searchParams.get('isActive');
    const studentId = searchParams.get('studentId');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.is_active = isActive === 'true' ? 1 : 0;
    }
    if (studentId) where.student_id = parseInt(studentId);

    const paymentPlans = await db.payment_plans.findMany({
      where,
      include: {
        student: {
          select: { student_id: true, name: true, student_code: true },
        },
        fee_structure: {
          select: { fee_structure_id: true, name: true, year: true, term: true },
        },
        _count: {
          select: { installments: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Summary stats
    const [allPlans, overdueInstallments, paidSum] = await Promise.all([
      db.payment_plans.aggregate({
        _sum: { total_amount: true, paid_amount: true },
        _count: { payment_plan_id: true },
        where: { is_active: 1 },
      }),
      db.payment_installments.findMany({
        where: {
          status: 'overdue',
        },
        select: { amount: true, payment_plan_id: true },
      }),
      db.payment_plans.aggregate({
        _sum: { paid_amount: true },
      }),
    ]);

    const overdueAmount = overdueInstallments.reduce((s, i) => s + (i.amount - i.paid_amount), 0);

    // Mark overdue installments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueIds = await db.payment_installments.findMany({
      where: {
        status: 'pending',
        due_date: { lt: today },
      },
      select: { installment_id: true },
    });

    if (overdueIds.length > 0) {
      await db.payment_installments.updateMany({
        where: { installment_id: { in: overdueIds.map((i) => i.installment_id) } },
        data: { status: 'overdue' },
      });
    }

    return NextResponse.json({
      paymentPlans,
      summary: {
        total: paymentPlans.length,
        active: paymentPlans.filter((p) => p.status === 'active').length,
        overdueAmount,
        collectedAmount: paidSum._sum.paid_amount || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching payment plans:', error);
    return NextResponse.json({ error: 'Failed to fetch payment plans' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, description, numberOfPayments, frequency, startDate, totalAmount,
      studentId, feeStructureId, installments: customInstallments,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const parsedTotal = totalAmount ? parseFloat(totalAmount) : 0;
    const parsedInstallments = parseInt(numberOfPayments) || 1;

    const plan = await db.payment_plans.create({
      data: {
        name,
        description: description || '',
        number_of_payments: parsedInstallments,
        frequency: frequency || 'monthly',
        is_active: 1,
        total_amount: parsedTotal,
        paid_amount: 0,
        status: 'active',
        start_date: startDate ? new Date(startDate) : new Date(),
        student_id: studentId ? parseInt(studentId) : null,
        fee_structure_id: feeStructureId ? parseInt(feeStructureId) : null,
      },
    });

    // Auto-generate installments
    const installmentAmount = parsedTotal > 0 ? parsedTotal / parsedInstallments : 0;
    const baseDate = startDate ? new Date(startDate) : new Date();
    const endDate = new Date(baseDate);
    const generatedInstallments = [];

    for (let i = 0; i < parsedInstallments; i++) {
      const dueDate = new Date(baseDate);
      switch (frequency) {
        case 'weekly': dueDate.setDate(dueDate.getDate() + i * 7); break;
        case 'bi-weekly': dueDate.setDate(dueDate.getDate() + i * 14); break;
        case 'monthly': dueDate.setMonth(dueDate.getMonth() + i); break;
        case 'quarterly': dueDate.setMonth(dueDate.getMonth() + i * 3); break;
        case 'semi-annually': dueDate.setMonth(dueDate.getMonth() + i * 6); break;
        case 'annually': dueDate.setFullYear(dueDate.getFullYear() + i); break;
        default: dueDate.setMonth(dueDate.getMonth() + i);
      }

      if (i === parsedInstallments - 1) endDate.setTime(dueDate.getTime());

      const installment = await db.payment_installments.create({
        data: {
          payment_plan_id: plan.payment_plan_id,
          installment_number: i + 1,
          due_date: dueDate,
          amount: installmentAmount,
          paid_amount: 0,
          status: 'pending',
          student_id: studentId ? parseInt(studentId) : null,
        },
      });

      generatedInstallments.push(installment);
    }

    // Update plan end date
    await db.payment_plans.update({
      where: { payment_plan_id: plan.payment_plan_id },
      data: { end_date: endDate },
    });

    // Update fee structure status if linked
    if (feeStructureId) {
      // Already handled by relation
    }

    return NextResponse.json({
      plan,
      installments: generatedInstallments,
      message: `Payment plan created with ${parsedInstallments} installment(s)`,
    });
  } catch (error) {
    console.error('Error creating payment plan:', error);
    return NextResponse.json({ error: 'Failed to create payment plan' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, description, numberOfPayments, frequency, isActive, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

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

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

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
