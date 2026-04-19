import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get('reportType') || 'annual'; // annual | termly | daterange
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const term = searchParams.get('term') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    // ── Build date range for payments and expenses ──
    let paymentWhere: Record<string, unknown> = { approval_status: 'approved' };
    let expenseWhere: Record<string, unknown> = {};
    let invoiceWhere: Record<string, unknown> = {};

    if (reportType === 'daterange' && startDate && endDate) {
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T23:59:59');
      paymentWhere.timestamp = { gte: start, lte: end };
      expenseWhere.expense_date = { gte: start, lte: end };
      invoiceWhere.creation_timestamp = { gte: start, lte: end };
    } else if (reportType === 'termly' && term) {
      paymentWhere = { ...paymentWhere, year, term };
      // For expenses without term field, filter by year
      expenseWhere.expense_date = {
        gte: new Date(parseInt(year), 0, 1),
        lt: new Date(parseInt(year) + 1, 0, 1),
      };
      invoiceWhere = { year, term };
    } else {
      // Annual
      paymentWhere.year = year;
      expenseWhere.expense_date = {
        gte: new Date(parseInt(year), 0, 1),
        lt: new Date(parseInt(year) + 1, 0, 1),
      };
      invoiceWhere.year = year;
    }

    // ── Income vs Expense summary ──
    const [paymentsAgg, expensesAgg, paymentCount, expenseCount] = await Promise.all([
      db.payment.aggregate({ where: paymentWhere, _sum: { amount: true } }),
      db.expense.aggregate({ where: expenseWhere, _sum: { amount: true } }),
      db.payment.count({ where: paymentWhere }),
      db.expense.count({ where: expenseWhere }),
    ]);

    const totalIncome = paymentsAgg._sum.amount || 0;
    const totalExpense = expensesAgg._sum.amount || 0;

    // ── Monthly breakdown (12 months of the year, or date range months) ──
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    let trendStart: Date;
    let trendEnd: Date;
    if (reportType === 'daterange' && startDate && endDate) {
      trendStart = new Date(startDate + 'T00:00:00');
      trendEnd = new Date(endDate + 'T23:59:59');
    } else {
      trendStart = new Date(parseInt(year), 0, 1);
      trendEnd = new Date(parseInt(year), 11, 31, 23, 59, 59);
    }

    const [monthlyPayments, monthlyExpenses] = await Promise.all([
      db.payment.findMany({
        where: { timestamp: { gte: trendStart, lte: trendEnd }, approval_status: 'approved' },
        select: { amount: true, timestamp: true },
      }),
      db.expense.findMany({
        where: { expense_date: { gte: trendStart, lte: trendEnd } },
        select: { amount: true, expense_date: true },
      }),
    ]);

    const incomeByMonth: Record<string, number> = {};
    const expenseByMonth: Record<string, number> = {};

    for (const p of monthlyPayments) {
      if (p.timestamp) {
        const key = `${p.timestamp.getFullYear()}-${String(p.timestamp.getMonth()).padStart(2, '0')}`;
        incomeByMonth[key] = (incomeByMonth[key] || 0) + p.amount;
      }
    }
    for (const e of monthlyExpenses) {
      if (e.expense_date) {
        const key = `${e.expense_date.getFullYear()}-${String(e.expense_date.getMonth()).padStart(2, '0')}`;
        expenseByMonth[key] = (expenseByMonth[key] || 0) + e.amount;
      }
    }

    const allMonths = [...new Set([...Object.keys(incomeByMonth), ...Object.keys(expenseByMonth)])].sort();
    const incomeExpenseTrend = allMonths.map((key) => {
      const [y, m] = key.split('-');
      return {
        month: monthNames[parseInt(m)],
        year: y,
        income: incomeByMonth[key] || 0,
        expense: expenseByMonth[key] || 0,
      };
    });

    // ── Payment method breakdown ──
    const methodDistribution = await db.payment.groupBy({
      by: ['payment_method'],
      where: paymentWhere,
      _sum: { amount: true },
      _count: true,
    });

    // ── Fee type breakdown (daily_fee_transactions) ──
    const feeTypeWhere: Record<string, unknown> = {};
    if (reportType === 'daterange' && startDate && endDate) {
      feeTypeWhere.payment_date = { gte: new Date(startDate + 'T00:00:00'), lte: new Date(endDate + 'T23:59:59') };
    } else if (reportType === 'termly' && term) {
      feeTypeWhere.year = year;
      feeTypeWhere.term = term;
    } else {
      feeTypeWhere.year = year;
    }

    const feeTypeAgg = await db.daily_fee_transactions.aggregate({
      where: feeTypeWhere,
      _sum: {
        feeding_amount: true,
        breakfast_amount: true,
        classes_amount: true,
        water_amount: true,
        transport_amount: true,
        total_amount: true,
      },
      _count: true,
    });

    const feeTypeBreakdown = [
      { type: 'Feeding', total: feeTypeAgg._sum.feeding_amount || 0, color: '#f97316' },
      { type: 'Breakfast', total: feeTypeAgg._sum.breakfast_amount || 0, color: '#eab308' },
      { type: 'Classes', total: feeTypeAgg._sum.classes_amount || 0, color: '#059669' },
      { type: 'Water', total: feeTypeAgg._sum.water_amount || 0, color: '#0284c7' },
      { type: 'Transport', total: feeTypeAgg._sum.transport_amount || 0, color: '#7c3aed' },
    ].filter((f) => f.total > 0);

    // ── Outstanding by class ──
    const outstandingInvoices = await db.invoice.findMany({
      where: {
        ...invoiceWhere,
        status: { in: ['unpaid', 'partial', 'overdue'] },
        due: { gt: 0 },
      },
      select: { class_name: true, due: true },
    });

    const classOutstanding: Record<string, number> = {};
    for (const inv of outstandingInvoices) {
      const cls = inv.class_name || 'Unknown';
      classOutstanding[cls] = (classOutstanding[cls] || 0) + inv.due;
    }
    const outstandingByClass = Object.entries(classOutstanding)
      .map(([cls, amount]) => ({ class: cls, amount }))
      .sort((a, b) => b.amount - a.amount);

    const totalOutstanding = outstandingByClass.reduce((s, c) => s + c.amount, 0);

    // ── Collection efficiency ──
    const [totalInvoices, totalPaid] = await Promise.all([
      db.invoice.aggregate({ where: invoiceWhere, _sum: { amount: true }, _count: true }),
      db.invoice.aggregate({ where: { ...invoiceWhere, status: 'paid' }, _count: true }),
    ]);

    const totalInvoiced = totalInvoices._sum.amount || 0;
    const invoicesCount = totalInvoices._count || 0;
    const paidCount = totalPaid._count || 0;
    const collectionRate = invoicesCount > 0 ? (paidCount / invoicesCount) * 100 : 0;

    // ── Invoice status counts ──
    const invoiceStatusCounts = await db.invoice.groupBy({
      by: ['status'],
      where: invoiceWhere,
      _count: true,
    });

    // ── Top collectors (staff/admin who collected the most) ──
    // Using receipts generated_by field
    const receiptWhere: Record<string, unknown> = {};
    if (reportType === 'daterange' && startDate && endDate) {
      receiptWhere.generated_at = { gte: new Date(startDate + 'T00:00:00'), lte: new Date(endDate + 'T23:59:59') };
    } else {
      receiptWhere.generated_at = { gte: trendStart, lte: trendEnd };
    }

    const topCollectorsRaw = await db.$queryRaw<Array<{ generated_by: string; total: number; count: number }>>`
      SELECT generated_by, SUM(amount) as total, COUNT(*) as count
      FROM receipts
      WHERE generated_at >= ${trendStart.toISOString()} AND generated_at <= ${trendEnd.toISOString()}
        AND generated_by IS NOT NULL AND generated_by != ''
      GROUP BY generated_by
      ORDER BY total DESC
      LIMIT 10
    `;

    const topCollectors = topCollectorsRaw.map((c) => ({
      name: c.generated_by,
      total: c.total,
      transactions: c.count,
    }));

    // ── Revenue by class ──
    const revenueByClassRaw = await db.$queryRaw<Array<{ class_name: string; total: number }>>`
      SELECT i.class_name, SUM(p.amount) as total
      FROM payment p
      JOIN invoice i ON p.invoice_id = i.invoice_id
      WHERE p.approval_status = 'approved'
        AND p.timestamp >= ${trendStart.toISOString()} AND p.timestamp <= ${trendEnd.toISOString()}
        AND i.class_name IS NOT NULL AND i.class_name != ''
      GROUP BY i.class_name
      ORDER BY total DESC
      LIMIT 20
    `;

    const revenueByClass = revenueByClassRaw.map((r) => ({
      class_name: r.class_name,
      total: r.total,
    }));

    // ── Cash position (bank accounts) ──
    const bankAccounts = await db.bank_accounts.findMany({
      select: { account_name: true, current_balance: true },
    });
    const cashPosition = bankAccounts.reduce((s, a) => s + (a.current_balance || 0), 0);

    return NextResponse.json({
      reportType,
      filters: { year, term, startDate, endDate },
      incomeExpense: {
        totalIncome,
        totalExpense,
        netIncome: totalIncome - totalExpense,
        incomeTransactions: paymentCount,
        expenseTransactions: expenseCount,
      },
      incomeExpenseTrend,
      methodDistribution: methodDistribution
        .filter((m) => (m._sum.amount || 0) > 0)
        .map((m) => ({
          method: (m.payment_method || 'Unknown').replace(/_/g, ' '),
          amount: m._sum.amount || 0,
          count: m._count,
        })),
      feeTypeBreakdown,
      outstandingByClass,
      totalOutstanding,
      collectionEfficiency: {
        rate: Math.round(collectionRate * 10) / 10,
        studentsPaid: paidCount,
        totalStudents: invoicesCount,
        totalInvoiced,
      },
      invoiceStatusCounts: invoiceStatusCounts.map((i) => ({ status: i.status, count: i._count })),
      dailyFeeSummary: {
        total: feeTypeAgg._sum.total_amount || 0,
        feeding: feeTypeAgg._sum.feeding_amount || 0,
        breakfast: feeTypeAgg._sum.breakfast_amount || 0,
        classes: feeTypeAgg._sum.classes_amount || 0,
        water: feeTypeAgg._sum.water_amount || 0,
        transport: feeTypeAgg._sum.transport_amount || 0,
      },
      topCollectors,
      revenueByClass,
      cashPosition,
    });
  } catch (error) {
    console.error('Error fetching financial report:', error);
    return NextResponse.json({ error: 'Failed to fetch financial report' }, { status: 500 });
  }
}
