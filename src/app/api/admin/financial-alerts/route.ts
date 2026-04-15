import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/financial-alerts - Financial alerts data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const alertType = searchParams.get('type') || 'all';

    const settings = await db.settings.findMany({
      where: { type: { in: ['running_year', 'running_term'] } },
    });
    let year = '', term = '';
    settings.forEach((s: any) => {
      if (s.type === 'running_year') year = s.description;
      if (s.type === 'running_term') term = s.description;
    });

    const alerts: any[] = [];

    // 1. Overdue invoices
    if (alertType === 'all' || alertType === 'overdue') {
      const overdueInvoices = await db.invoice.findMany({
        where: {
          due: { gt: 0 },
          status: { in: ['unpaid', 'partial'] },
          year,
          term,
        },
        include: {
          student: { select: { student_id: true, name: true, student_code: true } },
        },
        orderBy: { due: 'desc' },
        take: 50,
      });

      overdueInvoices.forEach((inv: any) => {
        const daysSinceCreation = inv.creation_timestamp
          ? Math.floor((Date.now() - new Date(inv.creation_timestamp).getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        alerts.push({
          type: 'overdue',
          severity: daysSinceCreation > 60 ? 'critical' : daysSinceCreation > 30 ? 'high' : 'medium',
          title: `Overdue Invoice: ${inv.invoice_code}`,
          description: `${inv.student?.name} owes GH\u20B5 ${inv.due.toFixed(2)} on invoice ${inv.invoice_code}`,
          amount: inv.due,
          studentName: inv.student?.name,
          studentCode: inv.student?.student_code,
          reference: inv.invoice_code,
          days: daysSinceCreation,
          createdAt: inv.creation_timestamp,
        });
      });
    }

    // 2. Students with high daily fee balances (high activity)
    if (alertType === 'all' || alertType === 'high_balance') {
      const highBalanceWallets = await db.daily_fee_wallet.findMany({
        where: {
          OR: [
            { feeding_balance: { gt: 500 } },
            { classes_balance: { gt: 500 } },
          ],
        },
        include: {
          student: { select: { student_id: true, name: true, student_code: true } },
        },
        orderBy: { id: 'desc' },
        take: 30,
      });

      highBalanceWallets.forEach((w: any) => {
        const total = w.feeding_balance + w.breakfast_balance + w.classes_balance + w.water_balance + w.transport_balance;
        alerts.push({
          type: 'high_balance',
          severity: total > 2000 ? 'critical' : 'medium',
          title: `High Balance: ${w.student?.name}`,
          description: `Cumulative wallet balance of GH\u20B5 ${total.toFixed(2)}`,
          amount: total,
          studentName: w.student?.name,
          studentCode: w.student?.student_code,
          breakdown: {
            feeding: w.feeding_balance,
            breakfast: w.breakfast_balance,
            classes: w.classes_balance,
            water: w.water_balance,
            transport: w.transport_balance,
          },
        });
      });
    }

    // 3. Unusual transactions (large amounts)
    if (alertType === 'all' || alertType === 'unusual') {
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);

      const recentTx = await db.daily_fee_transactions.findMany({
        where: { payment_date: { gte: weekAgo, lte: now } },
        include: {
          student: { select: { student_id: true, name: true, student_code: true } },
        },
        orderBy: { total_amount: 'desc' },
        take: 20,
      });

      // Calculate average
      const allWeekTx = await db.daily_fee_transactions.findMany({
        where: { payment_date: { gte: weekAgo, lte: now } },
      });
      const avgAmount = allWeekTx.length > 0
        ? allWeekTx.reduce((s, t) => s + t.total_amount, 0) / allWeekTx.length
        : 0;
      const threshold = avgAmount * 3; // 3x average = unusual

      recentTx.forEach((tx: any) => {
        if (tx.total_amount > threshold && threshold > 0) {
          alerts.push({
            type: 'unusual',
            severity: 'high',
            title: `Large Transaction: GH\u20B5 ${tx.total_amount.toFixed(2)}`,
            description: `${tx.student?.name} paid GH\u20B5 ${tx.total_amount.toFixed(2)} (${tx.payment_method}) - ${Math.round((tx.total_amount / avgAmount) * 100)}% of average`,
            amount: tx.total_amount,
            studentName: tx.student?.name,
            studentCode: tx.student?.student_code,
            reference: tx.transaction_code,
            method: tx.payment_method,
            averageAmount: avgAmount,
            multiplier: Math.round((tx.total_amount / avgAmount) * 10) / 10,
          });
        }
      });
    }

    // 4. Collection shortfall
    if (alertType === 'all' || alertType === 'shortfall') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const todayTx = await db.daily_fee_transactions.findMany({
        where: { payment_date: { gte: today, lte: endOfDay } },
      });
      const todayTotal = todayTx.reduce((s, t) => s + t.total_amount, 0);

      // Get yesterday for comparison
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);

      const yesterdayTx = await db.daily_fee_transactions.findMany({
        where: { payment_date: { gte: yesterday, lte: yesterdayEnd } },
      });
      const yesterdayTotal = yesterdayTx.reduce((s, t) => s + t.total_amount, 0);

      // Get last 7 days average
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekTx = await db.daily_fee_transactions.findMany({
        where: { payment_date: { gte: weekAgo, lte: yesterdayEnd } },
      });
      const weekAvg = weekTx.length > 0
        ? weekTx.reduce((s, t) => s + t.total_amount, 0) / Math.max(1, Math.ceil(7))
        : 0;

      const shortfall = weekAvg - todayTotal;
      if (shortfall > weekAvg * 0.3 && weekAvg > 0) {
        alerts.push({
          type: 'shortfall',
          severity: shortfall > weekAvg * 0.5 ? 'critical' : 'high',
          title: `Collection Shortfall: GH\u20B5 ${shortfall.toFixed(2)}`,
          description: `Today collected GH\u20B5 ${todayTotal.toFixed(2)} vs 7-day average of GH\u20B5 ${weekAvg.toFixed(2)}`,
          amount: shortfall,
          todayTotal,
          yesterdayTotal,
          weekAverage: weekAvg,
        });
      }
    }

    // 5. Pending approvals
    if (alertType === 'all' || alertType === 'pending_approvals') {
      const pendingApprovals = await db.approval_request.findMany({
        where: { status: 'pending' },
        orderBy: { created_at: 'desc' },
        take: 20,
      });

      pendingApprovals.forEach((req: any) => {
        const daysPending = Math.floor((Date.now() - new Date(req.created_at).getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({
          type: 'pending_approvals',
          severity: daysPending > 3 ? 'high' : 'low',
          title: `Pending: ${req.title}`,
          description: `${req.request_type} request by ${req.requested_by} - ${daysPending} days ago`,
          reference: req.reference_code,
          requestType: req.request_type,
          daysPending,
          createdAt: req.created_at,
        });
      });
    }

    // Sort by severity
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3));

    // Summary counts
    const summary = {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length,
      overdue: alerts.filter(a => a.type === 'overdue').length,
      highBalance: alerts.filter(a => a.type === 'high_balance').length,
      unusual: alerts.filter(a => a.type === 'unusual').length,
      shortfall: alerts.filter(a => a.type === 'shortfall').length,
      pendingApprovals: alerts.filter(a => a.type === 'pending_approvals').length,
    };

    return NextResponse.json({ alerts, summary });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
