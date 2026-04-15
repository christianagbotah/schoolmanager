import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/expenses/dashboard - Enhanced expenditure dashboard data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const month = searchParams.get('month') || '';

    // Overall stats
    const totalExpenses = await db.expense.aggregate({ _sum: { amount: true } });
    const approvedExpenses = await db.expense.aggregate({ where: { status: 'approved' }, _sum: { amount: true } });
    const pendingExpenses = await db.expense.aggregate({ where: { status: 'pending' }, _sum: { amount: true } });

    // Total count
    const totalCount = await db.expense.count();

    // This month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const thisMonth = await db.expense.aggregate({
      where: { expense_date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    });
    const thisMonthCount = await db.expense.count({
      where: { expense_date: { gte: monthStart, lte: monthEnd } },
    });

    // Previous month comparison
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const prevMonth = await db.expense.aggregate({
      where: { expense_date: { gte: prevMonthStart, lte: prevMonthEnd } },
      _sum: { amount: true },
    });
    const prevMonthCount = await db.expense.count({
      where: { expense_date: { gte: prevMonthStart, lte: prevMonthEnd } },
    });

    const thisMonthAmount = thisMonth._sum.amount || 0;
    const prevMonthAmount = prevMonth._sum.amount || 0;
    const monthChangePercent = prevMonthAmount > 0
      ? (((thisMonthAmount - prevMonthAmount) / prevMonthAmount) * 100)
      : (thisMonthAmount > 0 ? 100 : 0);

    // Today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const today = await db.expense.aggregate({
      where: { expense_date: { gte: todayStart } },
      _sum: { amount: true },
    });

    // Spending by category
    const categoryBreakdown = await db.$queryRaw<any[]>`
      SELECT ec.expense_category_name as category, ec.expense_category_id,
             COUNT(e.id) as count, COALESCE(SUM(e.amount), 0) as total
      FROM expense e
      LEFT JOIN expense_category ec ON e.category_id = ec.expense_category_id
      GROUP BY e.category_id
      ORDER BY total DESC
    `;

    // Monthly trends (last 12 months)
    const monthlyTrends = await db.$queryRaw<any[]>`
      SELECT CAST(strftime('%m', expense_date) AS INTEGER) as month,
             CAST(strftime('%Y', expense_date) AS INTEGER) as year,
             SUM(amount) as total,
             COUNT(*) as count
      FROM expense
      WHERE expense_date IS NOT NULL
        AND expense_date >= date('now', '-11 months')
      GROUP BY strftime('%Y-%m', expense_date)
      ORDER BY year ASC, month ASC
    `;

    // Payment method breakdown
    const methodBreakdown = await db.expense.groupBy({
      by: ['payment_method'],
      _sum: { amount: true },
      _count: { id: true },
    });

    // Top 10 expenses
    const topExpenses = await db.expense.findMany({
      orderBy: { amount: 'desc' },
      include: { expense_category: { select: { expense_category_name: true } } },
      take: 10,
    });

    // Recent expenses
    const recentExpenses = await db.expense.findMany({
      orderBy: { expense_date: 'desc' },
      include: { expense_category: { select: { expense_category_name: true } } },
      take: 10,
    });

    // Average expense
    const avgExpense = await db.expense.aggregate({ _avg: { amount: true } });

    // Budget data - from chart_of_accounts (account_type = 'expense')
    const budgetAccounts = await db.chart_of_accounts.findMany({
      where: { account_type: 'expense' },
      select: { account_id: true, account_code: true, account_name: true, opening_balance: true, current_balance: true, account_category: true },
    });

    // Category-wise spending for pie chart (this year)
    const categoryPieData = await db.$queryRaw<any[]>`
      SELECT ec.expense_category_name as category,
             COALESCE(SUM(e.amount), 0) as total
      FROM expense e
      LEFT JOIN expense_category ec ON e.category_id = ec.expense_category_id
      WHERE e.expense_date IS NOT NULL
        AND CAST(strftime('%Y', e.expense_date) AS INTEGER) = CAST(strftime('%Y', 'now') AS INTEGER)
      GROUP BY e.category_id
      HAVING total > 0
      ORDER BY total DESC
    `;

    return NextResponse.json({
      overview: {
        totalAmount: totalExpenses._sum.amount || 0,
        approvedAmount: approvedExpenses._sum.amount || 0,
        pendingAmount: pendingExpenses._sum.amount || 0,
        thisMonthAmount,
        thisMonthCount,
        todayAmount: today._sum.amount || 0,
        averageExpense: avgExpense._avg.amount || 0,
        totalCount,
      },
      comparison: {
        prevMonthAmount,
        prevMonthCount,
        monthChangePercent: Math.round(monthChangePercent * 10) / 10,
        isIncrease: monthChangePercent > 0,
      },
      categoryBreakdown,
      categoryPieData,
      monthlyTrends,
      methodBreakdown: methodBreakdown.map(m => ({
        method: m.payment_method || 'other',
        total: m._sum.amount || 0,
        count: m._count.id,
      })),
      topExpenses,
      recentExpenses,
      budget: {
        totalBudget: budgetAccounts.reduce((s, a) => s + (a.opening_balance || 0), 0),
        totalSpent: budgetAccounts.reduce((s, a) => s + Math.abs(a.current_balance || 0), 0),
        accounts: budgetAccounts,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
