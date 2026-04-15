import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch all wallet balances
    const wallets = await db.daily_fee_wallet.findMany({
      include: {
        student: {
          select: { name: true, student_code: true },
        },
      },
    });

    // Build wallet balance data
    const walletData = wallets.map(w => ({
      student_id: w.student_id,
      name: w.student?.name || 'Unknown',
      student_code: w.student?.student_code || '',
      feeding_balance: w.feeding_balance,
      breakfast_balance: w.breakfast_balance,
      classes_balance: w.classes_balance,
      water_balance: w.water_balance,
      transport_balance: w.transport_balance,
      total: w.feeding_balance + w.breakfast_balance + w.classes_balance + w.water_balance + w.transport_balance,
    })).filter(w => w.total > 0).sort((a, b) => b.total - a.total);

    // Recent transactions for trend
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTransactions = await db.daily_fee_transactions.findMany({
      where: {
        payment_date: { gte: thirtyDaysAgo },
        total_amount: { gt: 0 },
        payment_method: { not: 'sms' },
        student_id: { not: 0 },
      },
      orderBy: { payment_date: 'desc' },
      take: 500,
    });

    // Group by date for trend
    const dateMap = new Map<string, { feeding: number; breakfast: number; classes: number; water: number; transport: number; total: number }>();
    for (const t of recentTransactions) {
      const dateKey = t.payment_date ? new Date(t.payment_date).toISOString().split('T')[0] : 'unknown';
      const existing = dateMap.get(dateKey) || { feeding: 0, breakfast: 0, classes: 0, water: 0, transport: 0, total: 0 };
      existing.feeding += t.feeding_amount;
      existing.breakfast += t.breakfast_amount;
      existing.classes += t.classes_amount;
      existing.water += t.water_amount;
      existing.transport += t.transport_amount;
      existing.total += t.total_amount;
      dateMap.set(dateKey, existing);
    }

    const trends = Array.from(dateMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14); // Last 14 days

    // Top creditors (students with highest balances)
    const topCreditors = walletData.slice(0, 10).map(w => ({
      name: w.name,
      student_code: w.student_code,
      total_credits: w.total,
      transactions: recentTransactions.filter(t => t.student_id === w.student_id).length,
    }));

    // Summary
    const totalBalance = walletData.reduce((s, w) => s + w.total, 0);
    const totalCredits = recentTransactions.reduce((s, t) => s + t.total_amount, 0);

    const summary = {
      totalBalance,
      studentsWithCredit: walletData.length,
      avgBalance: walletData.length > 0 ? totalBalance / walletData.length : 0,
      totalCredits,
    };

    return NextResponse.json({ wallets: walletData, trends, topCreditors, summary });
  } catch (error) {
    console.error('Error fetching credit statistics:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
