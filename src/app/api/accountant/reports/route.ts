import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get('type') || 'income_statement';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    // Default: current month if no dates
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const from = startDate ? new Date(startDate) : monthStart;
    const to = endDate ? new Date(endDate) : monthEnd;

    // Common data
    const [paymentAgg, expenseAgg] = await Promise.all([
      db.payment.aggregate({
        where: { timestamp: { gte: from, lte: to } },
        _sum: { amount: true },
        _count: true,
      }),
      db.expense.aggregate({
        where: { expense_date: { gte: from, lte: to } },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    // Payment method breakdown
    const paymentMethods = await db.payment.groupBy({
      by: ['payment_method'],
      where: { timestamp: { gte: from, lte: to } },
      _sum: { amount: true },
      _count: true,
    });

    // Expense category breakdown
    const expenseCategories = await db.expense.groupBy({
      by: ['category_id'],
      where: { expense_date: { gte: from, lte: to } },
      _sum: { amount: true },
    });

    const allCategories = await db.expense_category.findMany();
    const catMap = allCategories.reduce((acc, c) => {
      acc[c.expense_category_id] = c.expense_category_name;
      return acc;
    }, {} as Record<number, string>);

    const expenseByCategory = expenseCategories.map(ec => ({
      category: catMap[ec.category_id!] || 'Uncategorized',
      amount: ec._sum.amount || 0,
    }));

    // Monthly trend (last 12 months)
    const monthlyTrend = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthName = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      const [mIncome, mExpense] = await Promise.all([
        db.payment.aggregate({
          where: { timestamp: { gte: d, lte: mEnd } },
          _sum: { amount: true },
        }),
        db.expense.aggregate({
          where: { expense_date: { gte: d, lte: mEnd } },
          _sum: { amount: true },
        }),
      ]);

      monthlyTrend.push({
        month: monthName,
        income: mIncome._sum.amount || 0,
        expenses: mExpense._sum.amount || 0,
        net: (mIncome._sum.amount || 0) - (mExpense._sum.amount || 0),
      });
    }

    // Trial balance from chart of accounts
    const accounts = await db.chart_of_accounts.findMany({
      include: {
        journal_lines: {
          include: {
            entry: true,
          },
        },
      },
    });

    let totalDebit = 0;
    let totalCredit = 0;
    const trialBalance = accounts.map(acc => {
      let debit = 0;
      let credit = 0;
      debit += acc.opening_balance > 0 ? acc.opening_balance : 0;
      credit += acc.opening_balance < 0 ? Math.abs(acc.opening_balance) : 0;
      acc.journal_lines.forEach(line => {
        debit += line.debit;
        credit += line.credit;
      });
      totalDebit += debit;
      totalCredit += credit;
      return {
        code: acc.account_code,
        name: acc.account_name,
        type: acc.account_type,
        category: acc.account_category,
        debit,
        credit,
        balance: debit - credit,
      };
    });

    // Bank accounts
    const bankAccounts = await db.bank_accounts.findMany();

    const totalIncome = paymentAgg._sum.amount || 0;
    const totalExpenses = expenseAgg._sum.amount || 0;

    return NextResponse.json({
      period: {
        from: from.toISOString(),
        to: to.toISOString(),
        fromLabel: from.toLocaleDateString(),
        toLabel: to.toLocaleDateString(),
      },
      incomeStatement: {
        totalRevenue: totalIncome,
        revenueCount: paymentAgg._count || 0,
        totalExpenses,
        expenseCount: expenseAgg._count || 0,
        netIncome: totalIncome - totalExpenses,
        profitMargin: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
      },
      balanceSheet: {
        totalAssets: bankAccounts.reduce((s, b) => s + b.current_balance, 0),
        totalLiabilities: totalExpenses,
        bankAccounts: bankAccounts.map(b => ({
          bankName: b.bank_name,
          accountNumber: b.account_number,
          accountName: b.account_name,
          balance: b.current_balance,
        })),
      },
      paymentMethods: paymentMethods.map(m => ({
        method: m.payment_method,
        amount: m._sum.amount || 0,
        count: m._count || 0,
      })),
      expenseByCategory,
      monthlyTrend,
      trialBalance: {
        accounts: trialBalance,
        totalDebit,
        totalCredit,
        balanced: Math.abs(totalDebit - totalCredit) < 0.01,
      },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
