import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Invoice aggregates
    const invoiceSummary = await db.invoice.aggregate({
      _sum: { amount: true, amount_paid: true, due: true },
      _count: true,
    });

    // Payment aggregates
    const [paymentTotal, paymentToday, paymentMonth] = await Promise.all([
      db.payment.aggregate({ _sum: { amount: true } }),
      db.payment.aggregate({
        where: { timestamp: { gte: todayStart } },
        _sum: { amount: true },
        _count: true,
      }),
      db.payment.aggregate({
        where: { timestamp: { gte: monthStart } },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    // Expense aggregates
    const [expenseTotal, expenseMonth] = await Promise.all([
      db.expense.aggregate({ _sum: { amount: true } }),
      db.expense.aggregate({
        where: { expense_date: { gte: monthStart } },
        _sum: { amount: true },
      }),
    ]);

    // Invoice counts by status
    const [paidCount, partialCount, unpaidCount] = await Promise.all([
      db.invoice.count({ where: { status: 'paid' } }),
      db.invoice.count({ where: { status: 'partial' } }),
      db.invoice.count({ where: { status: 'unpaid' } }),
    ]);

    // Bank balance (sum of bank accounts)
    const bankBalance = await db.bank_accounts.aggregate({
      _sum: { current_balance: true },
    });

    // Pending journal entries
    const pendingEntries = await db.journal_entries.count({
      where: { status: 'draft' },
    });

    // Budget utilization
    const budgetAccounts = await db.chart_of_accounts.findMany({
      where: { account_category: 'Budget' },
    });
    const budgetTotal = budgetAccounts.reduce((s, a) => s + a.current_balance, 0);
    const budgetUsed = expenseMonth._sum.amount || 0;
    const budgetPercentage = budgetTotal > 0 ? (budgetUsed / budgetTotal) * 100 : 0;

    // Net income
    const totalRevenue = paymentTotal._sum.amount || 0;
    const totalExpenses = expenseTotal._sum.amount || 0;
    const netIncome = totalRevenue - totalExpenses;

    // Monthly chart data (last 6 months)
    const monthlyData: { month: string; revenue: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });

      const [mRev, mExp] = await Promise.all([
        db.payment.aggregate({
          where: { timestamp: { gte: d, lte: mEnd } },
          _sum: { amount: true },
        }),
        db.expense.aggregate({
          where: { expense_date: { gte: d, lte: mEnd } },
          _sum: { amount: true },
        }),
      ]);

      monthlyData.push({
        month: monthName,
        revenue: mRev._sum.amount || 0,
        expenses: mExp._sum.amount || 0,
      });
    }

    // Recent payments (last 10)
    const recentPayments = await db.payment.findMany({
      include: {
        student: { select: { student_id: true, name: true, student_code: true } },
        invoice: { select: { invoice_code: true } },
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    // Top debtors (top 10 students with highest outstanding balance)
    const debtors = await db.invoice.groupBy({
      by: ['student_id'],
      where: { due: { gt: 0 } },
      _sum: { due: true },
      orderBy: { _sum: { due: 'desc' } },
      take: 10,
    });

    const debtorDetails = await Promise.all(
      debtors.map(async (d) => {
        const student = await db.student.findUnique({
          where: { student_id: d.student_id },
          select: { name: true, student_code: true },
        });
        return {
          student_id: d.student_id,
          name: student?.name || 'Unknown',
          student_code: student?.student_code || '',
          outstanding: d._sum.due || 0,
        };
      })
    );

    // Payment method breakdown for current month
    const methodBreakdown = await db.payment.groupBy({
      by: ['payment_method'],
      where: { timestamp: { gte: monthStart } },
      _sum: { amount: true },
      _count: true,
    });

    return NextResponse.json({
      metrics: {
        total_assets: bankBalance._sum.current_balance || 0,
        total_liabilities: invoiceSummary._sum.due || 0,
        monthly_revenue: paymentMonth._sum.amount || 0,
        monthly_expenses: expenseMonth._sum.amount || 0,
        net_income: netIncome,
        bank_balance: bankBalance._sum.current_balance || 0,
        pending_entries: pendingEntries,
        budget_used: budgetUsed,
        budget_total: budgetTotal,
        budget_percentage: budgetPercentage,
      },
      invoices: {
        totalBilled: invoiceSummary._sum.amount || 0,
        totalCollected: invoiceSummary._sum.amount_paid || 0,
        outstanding: invoiceSummary._sum.due || 0,
        total: invoiceSummary._count,
        paid: paidCount,
        partial: partialCount,
        unpaid: unpaidCount,
      },
      payments: {
        totalCollected: paymentTotal._sum.amount || 0,
        todayTotal: paymentToday._sum.amount || 0,
        todayCount: paymentToday._count || 0,
        monthTotal: paymentMonth._sum.amount || 0,
        monthCount: paymentMonth._count || 0,
      },
      expenses: {
        total: expenseTotal._sum.amount || 0,
        monthTotal: expenseMonth._sum.amount || 0,
      },
      monthlyData,
      recentPayments,
      topDebtors: debtorDetails,
      methodBreakdown: methodBreakdown.map(m => ({
        method: m.payment_method,
        amount: m._sum.amount || 0,
        count: m._count || 0,
      })),
    });
  } catch (error) {
    console.error('Error fetching accountant dashboard:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
