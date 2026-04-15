import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/receipts - List receipts with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const studentId = searchParams.get('studentId') || '';
    const receiptType = searchParams.get('receiptType') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (startDate) {
      where.generated_at = { ...(where.generated_at || {}), gte: new Date(startDate + 'T00:00:00') };
    }
    if (endDate) {
      where.generated_at = { ...(where.generated_at || {}), lte: new Date(endDate + 'T23:59:59') };
    }
    if (studentId) where.student_id = parseInt(studentId);
    if (receiptType) where.receipt_type = receiptType;

    let receipts;
    let total;

    if (search) {
      // Search by student name or receipt number
      receipts = await db.receipts.findMany({
        where: {
          ...where,
          OR: [
            { receipt_number: { contains: search } },
            { student: { OR: [{ name: { contains: search } }, { student_code: { contains: search } }] } },
          ],
        },
        include: {
          student: { select: { student_id: true, name: true, student_code: true } },
          parent: { select: { parent_id: true, name: true, phone: true } },
          payment: { select: { payment_id: true, payment_method: true, amount: true } },
        },
        orderBy: { generated_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });
      total = await db.receipts.count({
        where: {
          ...where,
          OR: [
            { receipt_number: { contains: search } },
            { student: { OR: [{ name: { contains: search } }, { student_code: { contains: search } }] } },
          ],
        },
      });
    } else {
      receipts = await db.receipts.findMany({
        where,
        include: {
          student: { select: { student_id: true, name: true, student_code: true } },
          parent: { select: { parent_id: true, name: true, phone: true } },
          payment: { select: { payment_id: true, payment_method: true, amount: true } },
        },
        orderBy: { generated_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });
      total = await db.receipts.count({ where });
    }

    const totalAmount = await db.receipts.aggregate({
      where,
      _sum: { amount: true },
    });

    return NextResponse.json({
      receipts,
      pagination: {
        page,
        totalPages: Math.ceil(total / limit),
        total,
      },
      summary: {
        totalAmount: totalAmount._sum.amount || 0,
        count: total,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
