import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year') || '2026';
    const term = searchParams.get('term') || '';

    // Income vs Expense
    const paymentsAgg = await db.payment.aggregate({
      where: { year, ...(term ? { term } : {}), approval_status: 'approved' },
      _sum: { amount: true },
    });

    const expensesAgg = await db.expense.aggregate({
      where: { expense_date: { gte: new Date(parseInt(year), 0, 1), lt: new Date(parseInt(year) + 1, 0, 1) } },
      _sum: { amount: true },
    });

    // Monthly income trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyPayments = await db.payment.findMany({
      where: {
        timestamp: { gte: sixMonthsAgo },
        approval_status: 'approved',
      },
      select: { amount: true, timestamp: true },
    });

    const monthlyExpenses = await db.expense.findMany({
      where: { expense_date: { gte: sixMonthsAgo } },
      select: { amount: true, expense_date: true },
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const incomeByMonth: Record<string, number> = {};
    const expenseByMonth: Record<string, number> = {};

    for (const p of monthlyPayments) {
      if (p.timestamp) {
        const key = `${p.timestamp.getFullYear()}-${monthNames[p.timestamp.getMonth()]}`;
        incomeByMonth[key] = (incomeByMonth[key] || 0) + p.amount;
      }
    }
    for (const e of monthlyExpenses) {
      if (e.expense_date) {
        const key = `${e.expense_date.getFullYear()}-${monthNames[e.expense_date.getMonth()]}`;
        expenseByMonth[key] = (expenseByMonth[key] || 0) + e.amount;
      }
    }

    const allMonths = [...new Set([...Object.keys(incomeByMonth), ...Object.keys(expenseByMonth)])].sort();
    const incomeExpenseTrend = allMonths.map(month => ({
      month: month.split('-')[1],
      income: incomeByMonth[month] || 0,
      expense: expenseByMonth[month] || 0,
    }));

    // Outstanding by class
    const outstandingByClass = await db.invoice.groupBy({
      by: ['class_name'],
      where: { status: { in: ['unpaid', 'partial', 'overdue'] }, year },
      _sum: { due: true },
      having: { due: { gt: 0 } },
    });

    // Payment method distribution
    const methodDistribution = await db.payment.groupBy({
      by: ['payment_method'],
      where: { approval_status: 'approved' },
      _sum: { amount: true },
      _count: true,
    });

    // Daily fee collections
    const dailyFeeAgg = await db.daily_fee_transactions.aggregate({
      where: { year },
      _sum: {
        feeding_amount: true,
        breakfast_amount: true,
        classes_amount: true,
        water_amount: true,
        transport_amount: true,
        total_amount: true,
      },
    });

    // Invoice status counts
    const invoiceStatusCounts = await db.invoice.groupBy({
      by: ['status'],
      where: { year },
      _count: true,
    });

    return NextResponse.json({
      incomeExpense: {
        totalIncome: paymentsAgg._sum.amount || 0,
        totalExpense: expensesAgg._sum.amount || 0,
        netIncome: (paymentsAgg._sum.amount || 0) - (expensesAgg._sum.amount || 0),
      },
      incomeExpenseTrend,
      outstandingByClass: outstandingByClass.map(item => ({
        class: item.class_name || 'Unknown',
        amount: item._sum.due || 0,
      })),
      methodDistribution: methodDistribution.map(item => ({
        method: item.payment_method.replace(/_/g, ' '),
        amount: item._sum.amount || 0,
        count: item._count,
      })),
      dailyFeeSummary: {
        total: dailyFeeAgg._sum.total_amount || 0,
        feeding: dailyFeeAgg._sum.feeding_amount || 0,
        breakfast: dailyFeeAgg._sum.breakfast_amount || 0,
        classes: dailyFeeAgg._sum.classes_amount || 0,
        water: dailyFeeAgg._sum.water_amount || 0,
        transport: dailyFeeAgg._sum.transport_amount || 0,
      },
      invoiceStatusCounts: invoiceStatusCounts.map(item => ({
        status: item.status,
        count: item._count,
      })),
    });
  } catch (error) {
    console.error('Error fetching financial report:', error);
    return NextResponse.json({ error: 'Failed to fetch financial report' }, { status: 500 });
  }
}
