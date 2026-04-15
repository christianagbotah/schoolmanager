import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/expenses/dashboard - Expenditure dashboard data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const month = searchParams.get('month') || '';

    // Overall stats
    const totalExpenses = await db.expense.aggregate({ _sum: { amount: true } });
    const approvedExpenses = await db.expense.aggregate({ where: { status: 'approved' }, _sum: { amount: true } });
    const pendingExpenses = await db.expense.aggregate({ where: { status: 'pending' }, _sum: { amount: true } });

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

    // Top expenses
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

    return NextResponse.json({
      overview: {
        totalAmount: totalExpenses._sum.amount || 0,
        approvedAmount: approvedExpenses._sum.amount || 0,
        pendingAmount: pendingExpenses._sum.amount || 0,
        thisMonthAmount: thisMonth._sum.amount || 0,
        thisMonthCount,
        todayAmount: today._sum.amount || 0,
        averageExpense: avgExpense._avg.amount || 0,
      },
      categoryBreakdown,
      monthlyTrends,
      methodBreakdown: methodBreakdown.map(m => ({
        method: m.payment_method || 'other',
        total: m._sum.amount || 0,
        count: m._count.id,
      })),
      topExpenses,
      recentExpenses,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
