import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/daily-fees/cashier - Cashier dashboard data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const today = new Date(date + 'T00:00:00');
    const tomorrow = new Date(date + 'T00:00:00');
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's transactions
    const transactions = await db.daily_fee_transactions.findMany({
      where: { payment_date: { gte: today, lt: tomorrow } },
      include: {
        student: { select: { student_id: true, name: true, student_code: true } },
      },
      orderBy: { id: 'desc' },
    });

    // Summary calculations
    let totalAmount = 0;
    let cashTotal = 0;
    let cashCount = 0;
    let momoTotal = 0;
    let momoCount = 0;
    let bankTotal = 0;
    let bankCount = 0;
    let chequeTotal = 0;
    let chequeCount = 0;
    let feedingTotal = 0;
    let breakfastTotal = 0;
    let classesTotal = 0;
    let waterTotal = 0;
    let transportTotal = 0;
    const byCollector: Record<string, { total: number; count: number }> = {};
    const uniqueStudents = new Set<number>();

    for (const tx of transactions) {
      totalAmount += tx.total_amount || 0;
      feedingTotal += tx.feeding_amount || 0;
      breakfastTotal += tx.breakfast_amount || 0;
      classesTotal += tx.classes_amount || 0;
      waterTotal += tx.water_amount || 0;
      transportTotal += tx.transport_amount || 0;
      uniqueStudents.add(tx.student_id);

      const method = tx.payment_method || 'cash';
      if (method === 'cash') { cashTotal += tx.total_amount || 0; cashCount++; }
      else if (method === 'mobile_money') { momoTotal += tx.total_amount || 0; momoCount++; }
      else if (method === 'bank_transfer') { bankTotal += tx.total_amount || 0; bankCount++; }
      else if (method === 'cheque') { chequeTotal += tx.total_amount || 0; chequeCount++; }

      const collector = tx.collected_by || 'Unknown';
      if (!byCollector[collector]) byCollector[collector] = { total: 0, count: 0 };
      byCollector[collector].total += tx.total_amount || 0;
      byCollector[collector].count++;
    }

    // Yesterday comparison
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayTx = await db.daily_fee_transactions.findMany({
      where: { payment_date: { gte: yesterday, lt: today } },
    });
    const yesterdayTotal = yesterdayTx.reduce((s, t) => s + (t.total_amount || 0), 0);

    // This week total
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
    const weekTx = await db.daily_fee_transactions.findMany({
      where: { payment_date: { gte: weekStart, lt: tomorrow } },
    });
    const weekTotal = weekTx.reduce((s, t) => s + (t.total_amount || 0), 0);

    // Hourly breakdown for today
    const hourlyData: Record<number, number> = {};
    for (const tx of transactions) {
      if (tx.payment_date) {
        const hour = new Date(tx.payment_date).getHours();
        hourlyData[hour] = (hourlyData[hour] || 0) + (tx.total_amount || 0);
      }
    }
    const hourlyBreakdown = Object.entries(hourlyData)
      .map(([hour, amount]) => ({
        hour: parseInt(hour),
        label: `${hour.toString().padStart(2, '0')}:00`,
        amount,
      }))
      .sort((a, b) => a.hour - b.hour);

    return NextResponse.json({
      date,
      summary: {
        totalAmount,
        transactionCount: transactions.length,
        uniqueStudents: uniqueStudents.size,
        cashTotal, cashCount,
        momoTotal, momoCount,
        bankTotal, bankCount,
        chequeTotal, chequeCount,
        feedingTotal, breakfastTotal, classesTotal, waterTotal, transportTotal,
        yesterdayTotal,
        yesterdayChange: yesterdayTotal > 0 ? ((totalAmount - yesterdayTotal) / yesterdayTotal * 100) : 0,
        weekTotal,
      },
      byCollector,
      hourlyBreakdown,
      recentTransactions: transactions.slice(0, 20),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
