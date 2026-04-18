import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId') || '';
    const year = searchParams.get('year') || '';
    const term = searchParams.get('term') || '';
    const status = searchParams.get('status') || '';
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search') || '';

    const where: Record<string, unknown> = {};

    if (classId) where.class_id = parseInt(classId);
    if (year) where.year = year;
    if (term) where.term = term;
    if (status) where.status = status;
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.is_active = isActive === 'true' ? 1 : 0;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [feeStructures, allActiveStructures] = await Promise.all([
      db.fee_structures.findMany({
        where,
        include: {
          class: {
            select: { class_id: true, name: true, name_numeric: true, category: true },
          },
          _count: {
            select: { payment_plans: true },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      db.fee_structures.findMany({
        where: { is_active: 1 },
        select: { total_amount: true },
      }),
    ]);

    const activeCount = feeStructures.filter((f) => f.is_active === 1).length;
    const totalCollectible = allActiveStructures.reduce((s, f) => s + f.total_amount, 0);

    return NextResponse.json({
      feeStructures,
      summary: {
        total: feeStructures.length,
        active: activeCount,
        totalCollectible,
      },
    });
  } catch (error) {
    console.error('Error fetching fee structures:', error);
    return NextResponse.json({ error: 'Failed to fetch fee structures' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, classId, year, term, totalAmount, description, isActive, status, installmentCount, dueDatesJson } = body;

    if (!id) {
      return NextResponse.json({ error: 'Fee structure ID is required' }, { status: 400 });
    }

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

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

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
