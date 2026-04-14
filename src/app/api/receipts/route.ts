import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};
    if (studentId) where.student_id = parseInt(studentId);

    const receipts = await db.receipts.findMany({
      where,
      include: {
        student: { select: { name: true, student_code: true } },
        parent: { select: { name: true } },
      },
      orderBy: { generated_at: 'desc' },
      take: limit,
    });

    return NextResponse.json(receipts);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json({ error: 'Failed to fetch receipts' }, { status: 500 });
  }
}
