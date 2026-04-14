import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const where: Record<string, unknown> = {};
    if (startDate && endDate) {
      where.payment_date = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const transactions = await db.daily_fee_transactions.findMany({
      where,
      include: { student: { select: { name: true, student_code: true } } },
      orderBy: { payment_date: 'desc' },
    });

    const summary = {
      totalAmount: 0,
      feedingTotal: 0,
      breakfastTotal: 0,
      classesTotal: 0,
      waterTotal: 0,
      transportTotal: 0,
      byCollector: {} as Record<string, number>,
      transactionCount: transactions.length,
    };

    for (const tx of transactions) {
      summary.totalAmount += tx.total_amount;
      summary.feedingTotal += tx.feeding_amount;
      summary.breakfastTotal += tx.breakfast_amount;
      summary.classesTotal += tx.classes_amount;
      summary.waterTotal += tx.water_amount;
      summary.transportTotal += tx.transport_amount;
      summary.byCollector[tx.collected_by] = (summary.byCollector[tx.collected_by] || 0) + tx.total_amount;
    }

    return NextResponse.json({ summary, transactions });
  } catch (error) {
    console.error('Error fetching daily fee report:', error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}
