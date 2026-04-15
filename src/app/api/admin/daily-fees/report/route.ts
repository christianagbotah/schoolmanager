import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/daily-fees/report - Daily fee statistics & reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const period = searchParams.get('period') || 'today'; // today, week, month
    const classId = searchParams.get('class_id') || '';

    // Determine date range based on period
    let targetDate: Date;
    let finalEnd: Date;

    if (period === 'week') {
      targetDate = new Date();
      const day = targetDate.getDay();
      targetDate.setDate(targetDate.getDate() - day); // Monday
      targetDate.setHours(0, 0, 0, 0);
      finalEnd = new Date(targetDate);
      finalEnd.setDate(finalEnd.getDate() + 6);
      finalEnd.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
      targetDate = new Date();
      targetDate.setDate(1);
      targetDate.setHours(0, 0, 0, 0);
      finalEnd = new Date();
      finalEnd.setHours(23, 59, 59, 999);
    } else {
      if (date) {
        targetDate = new Date(date);
      } else if (startDate) {
        targetDate = new Date(startDate);
      } else {
        targetDate = new Date();
      }
      targetDate.setHours(0, 0, 0, 0);
      if (endDate) {
        finalEnd = new Date(endDate);
        finalEnd.setHours(23, 59, 59, 999);
      } else {
        finalEnd = new Date(targetDate);
        finalEnd.setHours(23, 59, 59, 999);
      }
    }

    // Build where clause
    const where: any = { payment_date: { gte: targetDate, lte: finalEnd } };

    // Get all transactions for the period
    const transactions = await db.daily_fee_transactions.findMany({
      where,
      include: {
        student: { select: { name: true, student_code: true, student_id: true } },
      },
      orderBy: { payment_date: 'desc' },
    });

    // Aggregate summary
    const summary: Record<string, any> = {
      feedingTotal: 0,
      breakfastTotal: 0,
      classesTotal: 0,
      waterTotal: 0,
      transportTotal: 0,
      totalAmount: 0,
      transactionCount: transactions.length,
      cashTotal: 0,
      cashCount: 0,
      mobileMoneyTotal: 0,
      mobileMoneyCount: 0,
      bankTransferTotal: 0,
      bankTransferCount: 0,
      chequeTotal: 0,
      chequeCount: 0,
      byCollector: {} as Record<string, { total: number; count: number }>,
      uniqueStudents: new Set(transactions.map((t: any) => t.student_id)).size,
      startDate: targetDate.toISOString().split('T')[0],
      endDate: finalEnd.toISOString().split('T')[0],
    };

    for (const tx of transactions) {
      summary.feedingTotal += tx.feeding_amount;
      summary.breakfastTotal += tx.breakfast_amount;
      summary.classesTotal += tx.classes_amount;
      summary.waterTotal += tx.water_amount;
      summary.transportTotal += tx.transport_amount;
      summary.totalAmount += tx.total_amount;

      const method = (tx.payment_method || '').toLowerCase().replace(/ /g, '_');
      if (method === 'cash') { summary.cashTotal += tx.total_amount; summary.cashCount++; }
      else if (method === 'mobile_money' || method === 'momo') { summary.mobileMoneyTotal += tx.total_amount; summary.mobileMoneyCount++; }
      else if (method === 'bank_transfer') { summary.bankTransferTotal += tx.total_amount; summary.bankTransferCount++; }
      else if (method === 'cheque') { summary.chequeTotal += tx.total_amount; summary.chequeCount++; }

      const collector = tx.collected_by || 'Unknown';
      if (!summary.byCollector[collector]) summary.byCollector[collector] = { total: 0, count: 0 };
      summary.byCollector[collector].total += tx.total_amount;
      summary.byCollector[collector].count++;
    }
    summary.uniqueStudents = transactions.length > 0 ? new Set(transactions.map((t: any) => t.student_id)).size : 0;

    // Get last 7 days history (from targetDate)
    const history = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(targetDate);
      d.setDate(d.getDate() + i);
      if (d > finalEnd) continue;
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const dayTx = await db.daily_fee_transactions.findMany({
        where: { payment_date: { gte: dayStart, lte: dayEnd } },
      });

      const feeding = dayTx.reduce((s, t) => s + t.feeding_amount, 0);
      const breakfast = dayTx.reduce((s, t) => s + t.breakfast_amount, 0);
      const classes = dayTx.reduce((s, t) => s + t.classes_amount, 0);
      const water = dayTx.reduce((s, t) => s + t.water_amount, 0);
      const transport = dayTx.reduce((s, t) => s + t.transport_amount, 0);
      const total = dayTx.reduce((s, t) => s + t.total_amount, 0);

      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

      history.push({
        date: d.toISOString().split('T')[0],
        label: dayLabel,
        feeding,
        breakfast,
        classes,
        water,
        transport,
        total,
        count: dayTx.length,
      });
    }

    // Outstanding fees calculation
    const settings = await db.settings.findMany({
      where: { type: { in: ['running_year', 'running_term'] } },
    });
    let runningYear = '', runningTerm = '';
    settings.forEach((s: any) => {
      if (s.type === 'running_year') runningYear = s.description;
      if (s.type === 'running_term') runningTerm = s.description;
    });

    // Outstanding = total expected (sum of rates * expected days) - total collected per type
    // Simplified: just return wallet balances for today's context
    const wallets = await db.daily_fee_wallet.findMany({
      where: {
        OR: [
          { feeding_balance: { gt: 0 } },
          { breakfast_balance: { gt: 0 } },
          { classes_balance: { gt: 0 } },
          { water_balance: { gt: 0 } },
          { transport_balance: { gt: 0 } },
        ],
      },
      include: { student: { select: { student_id: true, name: true, student_code: true } } },
    });

    const outstandingSummary = {
      feedingOutstanding: wallets.reduce((s: number, w: any) => s + w.feeding_balance, 0),
      breakfastOutstanding: wallets.reduce((s: number, w: any) => s + w.breakfast_balance, 0),
      classesOutstanding: wallets.reduce((s: number, w: any) => s + w.classes_balance, 0),
      waterOutstanding: wallets.reduce((s: number, w: any) => s + w.water_balance, 0),
      transportOutstanding: wallets.reduce((s: number, w: any) => s + w.transport_balance, 0),
      totalOutstanding: 0,
      topDebtors: wallets
        .map((w: any) => ({
          student_id: w.student?.student_id,
          name: w.student?.name,
          student_code: w.student?.student_code,
          total: w.feeding_balance + w.breakfast_balance + w.classes_balance + w.water_balance + w.transport_balance,
        }))
        .filter((w: any) => w.total > 0)
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 10),
    };
    outstandingSummary.totalOutstanding = outstandingSummary.feedingOutstanding +
      outstandingSummary.breakfastOutstanding + outstandingSummary.classesOutstanding +
      outstandingSummary.waterOutstanding + outstandingSummary.transportOutstanding;

    return NextResponse.json({
      summary,
      history,
      transactions: transactions.slice(0, 50),
      outstanding: outstandingSummary,
      period,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
