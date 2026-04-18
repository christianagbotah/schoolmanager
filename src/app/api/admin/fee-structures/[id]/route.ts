import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const feeStructure = await db.fee_structures.findUnique({
      where: { fee_structure_id: parseInt(id) },
      include: {
        class: {
          select: { class_id: true, name: true, name_numeric: true, category: true },
        },
        _count: {
          select: { payment_plans: true },
        },
      },
    });

    if (!feeStructure) {
      return NextResponse.json({ error: 'Fee structure not found' }, { status: 404 });
    }

    // Get available bill items
    const billItems = await db.bill_item.findMany({
      where: { amount: { gt: 0 } },
      include: {
        bill_category: {
          select: { bill_category_id: true, bill_category_name: true },
        },
      },
      orderBy: { title: 'asc' },
    });

    // Parse due dates from JSON
    let dueDates: string[] = [];
    try {
      dueDates = JSON.parse(feeStructure.due_dates_json || '[]');
    } catch {
      dueDates = [];
    }

    // Student count for this class/year/term
    const enrollCount = feeStructure.class_id ? await db.enroll.count({
      where: {
        class_id: feeStructure.class_id,
        year: feeStructure.year,
        term: feeStructure.term,
        mute: 0,
      },
    }) : 0;

    // Payment plans using this fee structure
    const paymentPlanCount = await db.payment_plans.count({
      where: { fee_structure_id: parseInt(id) },
    });

    return NextResponse.json({
      ...feeStructure,
      dueDates,
      billItems,
      enrollCount,
      paymentPlanCount,
    });
  } catch (error) {
    console.error('Error fetching fee structure:', error);
    return NextResponse.json({ error: 'Failed to fetch fee structure' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, classId, year, term, totalAmount, description, installmentCount, dueDates } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json({ error: 'Total amount must be greater than 0' }, { status: 400 });
    }

    const feeStructure = await db.fee_structures.create({
      data: {
        name,
        class_id: classId ? parseInt(classId) : null,
        year: year || '',
        term: term || '',
        total_amount: parseFloat(totalAmount),
        description: description || '',
        is_active: 1,
        status: 'active',
        installment_count: installmentCount ? parseInt(installmentCount) : 1,
        due_dates_json: dueDates ? JSON.stringify(dueDates) : '[]',
      },
    });

    return NextResponse.json({ feeStructure, message: 'Fee structure created successfully' });
  } catch (error) {
    console.error('Error creating fee structure:', error);
    return NextResponse.json({ error: 'Failed to create fee structure' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, classId, year, term, totalAmount, description, isActive, status, installmentCount, dueDatesJson } = body;

    const existing = await db.fee_structures.findUnique({
      where: { fee_structure_id: parseInt(id) },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Fee structure not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (classId !== undefined) data.class_id = classId ? parseInt(classId) : null;
    if (year !== undefined) data.year = year;
    if (term !== undefined) data.term = term;
    if (totalAmount !== undefined) data.total_amount = parseFloat(totalAmount);
    if (description !== undefined) data.description = description;
    if (isActive !== undefined) data.is_active = isActive ? 1 : 0;
    if (status !== undefined) data.status = status;
    if (installmentCount !== undefined) data.installment_count = parseInt(installmentCount);
    if (dueDatesJson !== undefined) data.due_dates_json = dueDatesJson;

    const feeStructure = await db.fee_structures.update({
      where: { fee_structure_id: parseInt(id) },
      data,
    });

    return NextResponse.json({ feeStructure, message: 'Fee structure updated successfully' });
  } catch (error) {
    console.error('Error updating fee structure:', error);
    return NextResponse.json({ error: 'Failed to update fee structure' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.fee_structures.findUnique({
      where: { fee_structure_id: parseInt(id) },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Fee structure not found' }, { status: 404 });
    }

    await db.fee_structures.update({
      where: { fee_structure_id: parseInt(id) },
      data: { is_active: 0, status: 'archived' },
    });

    return NextResponse.json({ message: 'Fee structure deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating fee structure:', error);
    return NextResponse.json({ error: 'Failed to deactivate fee structure' }, { status: 500 });
  }
}
