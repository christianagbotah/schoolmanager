import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'daily';

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch transactions
    const transactions = await db.daily_fee_transactions.findMany({
      where: {
        payment_date: { gte: thirtyDaysAgo },
        total_amount: { gt: 0 },
        payment_method: { not: 'sms' },
      },
      orderBy: { payment_date: 'desc' },
      take: 1000,
    });

    // Group by date for trend
    const dateMap = new Map<string, { feeding: number; breakfast: number; classes: number; water: number; transport: number; total: number; transactions: number }>();

    for (const t of transactions) {
      const dateKey = t.payment_date ? new Date(t.payment_date).toISOString().split('T')[0] : 'unknown';
      const existing = dateMap.get(dateKey) || { feeding: 0, breakfast: 0, classes: 0, water: 0, transport: 0, total: 0, transactions: 0 };
      existing.feeding += t.feeding_amount;
      existing.breakfast += t.breakfast_amount;
      existing.classes += t.classes_amount;
      existing.water += t.water_amount;
      existing.transport += t.transport_amount;
      existing.total += t.total_amount;
      existing.transactions += 1;
      dateMap.set(dateKey, existing);
    }

    const daily = Array.from(dateMap.entries()).map(([date, data]) => ({ date, ...data })).sort((a, b) => a.date.localeCompare(b.date));

    // Group by collector
    const collectorMap = new Map<string, { total_collected: number; transactions: number }>();
    for (const t of transactions) {
      const key = t.collected_by || 'Unknown';
      const existing = collectorMap.get(key) || { total_collected: 0, transactions: 0 };
      existing.total_collected += t.total_amount;
      existing.transactions += 1;
      collectorMap.set(key, existing);
    }
    const collectors = Array.from(collectorMap.entries()).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.total_collected - a.total_collected);

    // By type
    const totalAll = transactions.reduce((s, t) => s + t.total_amount, 0);
    const types = [
      { type: 'feeding', total: transactions.reduce((s, t) => s + t.feeding_amount, 0) },
      { type: 'breakfast', total: transactions.reduce((s, t) => s + t.breakfast_amount, 0) },
      { type: 'classes', total: transactions.reduce((s, t) => s + t.classes_amount, 0) },
      { type: 'water', total: transactions.reduce((s, t) => s + t.water_amount, 0) },
      { type: 'transport', total: transactions.reduce((s, t) => s + t.transport_amount, 0) },
    ].map(t => ({ ...t, percentage: totalAll > 0 ? (t.total / totalAll) * 100 : 0 })).filter(t => t.total > 0).sort((a, b) => b.total - a.total);

    // Summary
    const uniqueDays = new Set(daily.map(d => d.date)).size;
    const summary = {
      total: totalAll,
      transactions: transactions.length,
      avgPerDay: uniqueDays > 0 ? Math.round(totalAll / uniqueDays) : 0,
      collectors: collectors.length,
    };

    // Apply period grouping
    let groupedDaily = daily;
    if (period === 'weekly') {
      const weekMap = new Map<string, typeof daily[0]>();
      for (const d of daily) {
        const date = new Date(d.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const key = weekStart.toISOString().split('T')[0];
        const existing = weekMap.get(key) || { date: `Week of ${key}`, feeding: 0, breakfast: 0, classes: 0, water: 0, transport: 0, total: 0, transactions: 0 };
        existing.feeding += d.feeding;
        existing.breakfast += d.breakfast;
        existing.classes += d.classes;
        existing.water += d.water;
        existing.transport += d.transport;
        existing.total += d.total;
        existing.transactions += d.transactions;
        weekMap.set(key, existing);
      }
      groupedDaily = Array.from(weekMap.values());
    }

    return NextResponse.json({ daily: groupedDaily, collectors, types, summary });
  } catch (error) {
    console.error('Error fetching fee statistics:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
