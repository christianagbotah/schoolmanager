import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const studentId = searchParams.get('studentId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};
    if (studentId) where.student_id = parseInt(studentId);
    if (startDate && endDate) {
      where.payment_date = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const [transactions, total] = await Promise.all([
      db.daily_fee_transactions.findMany({
        where,
        include: {
          student: { select: { student_id: true, name: true, student_code: true } },
        },
        orderBy: { payment_date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.daily_fee_transactions.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching daily fee transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
