import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/accountant/reconciliation - Financial reconciliation data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const today = new Date(date);
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Date range for summary
    const rangeStart = startDate ? new Date(startDate) : today;
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = endDate ? new Date(endDate) : endOfDay;
    rangeEnd.setHours(23, 59, 59, 999);

    const settings = await db.settings.findMany({
      where: { type: { in: ['running_year', 'running_term'] } },
    });
    let year = '', term = '';
    settings.forEach((s: any) => {
      if (s.type === 'running_year') year = s.description;
      if (s.type === 'running_term') term = s.description;
    });

    // Invoice payments for the day
    const payments = await db.payment.findMany({
      where: { timestamp: { gte: today, lte: endOfDay } },
      include: {
        student: { select: { student_id: true, name: true, student_code: true } },
        invoice: { select: { invoice_code: true, title: true } },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Daily fee transactions
    const dailyFeeTxns = await db.daily_fee_transactions.findMany({
      where: { payment_date: { gte: today, lte: endOfDay } },
      include: {
        student: { select: { student_id: true, name: true, student_code: true } },
      },
      orderBy: { id: 'desc' },
    });

    // Expenses for the day
    const expenses = await db.expense.findMany({
      where: { expense_date: { gte: today, lte: endOfDay } },
      orderBy: { expense_date: 'desc' },
    });

    // Bank accounts
    const bankAccounts = await db.bank_accounts.findMany();

    // Payment totals by method
    const paymentByMethod = payments.reduce((acc: Record<string, number>, p) => {
      const method = p.payment_method || 'Unknown';
      acc[method] = (acc[method] || 0) + p.amount;
      return acc;
    }, {});

    // Daily fee totals by method
    const dailyFeeByMethod = dailyFeeTxns.reduce((acc: Record<string, number>, t) => {
      const method = t.payment_method || 'Unknown';
      acc[method] = (acc[method] || 0) + t.total_amount;
      return acc;
    }, {});

    // Expected daily fees (based on attendance)
    const attendanceRecords = await db.attendance.findMany({
      where: { date: date, year, term, status: 'present' },
    });
    const presentStudentIds = [...new Set(attendanceRecords.map((a: any) => a.student_id))];
    const enrollments = await db.enroll.findMany({
      where: { student_id: { in: presentStudentIds }, year, term, mute: 0 },
      include: { class: { include: { daily_fee_rates: { where: { year, term } } } } },
    });

    let expectedDailyFees = 0;
    enrollments.forEach((e: any) => {
      const rate = e.class?.daily_fee_rates?.[0];
      if (rate) {
        expectedDailyFees += (rate.feeding_rate || 0) + (rate.breakfast_rate || 0) + (rate.classes_rate || 0) + (rate.water_rate || 0);
      }
    });

    const actualDailyFees = dailyFeeTxns.reduce((s, t) => s + t.total_amount, 0);

    // Journal entries for the day
    const journalEntries = await db.journal_entries.findMany({
      where: { entry_date: { gte: today, lte: endOfDay } },
      include: {
        lines: {
          include: {
            account: { select: { account_code: true, account_name: true, account_type: true } },
          },
        },
      },
      orderBy: { entry_id: 'desc' },
    });

    const totalDebit = journalEntries.reduce((s, e) => s + e.total_debit, 0);
    const totalCredit = journalEntries.reduce((s, e) => s + e.total_credit, 0);

    return NextResponse.json({
      date,
      summary: {
        totalPayments: payments.reduce((s, p) => s + p.amount, 0),
        paymentCount: payments.length,
        totalDailyFees: actualDailyFees,
        expectedDailyFees,
        dailyFeeDiscrepancy: actualDailyFees - expectedDailyFees,
        totalExpenses: expenses.reduce((s, e) => s + e.amount, 0),
        expenseCount: expenses.length,
        netCashFlow: payments.reduce((s, p) => s + p.amount, 0) + actualDailyFees - expenses.reduce((s, e) => s + e.amount, 0),
        journalEntries: journalEntries.length,
        totalDebit,
        totalCredit,
        journalBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
      },
      payments,
      dailyFeeTransactions: dailyFeeTxns,
      expenses,
      paymentByMethod,
      dailyFeeByMethod,
      journalEntries,
      bankAccounts,
      attendanceInfo: {
        presentCount: presentStudentIds.length,
        enrolledCount: enrollments.length,
      },
    });
  } catch (error: any) {
    console.error('Reconciliation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch reconciliation data' }, { status: 500 });
  }
}

// POST /api/accountant/reconciliation - Match a transaction or flag a discrepancy
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, transactionId, action, note } = body;

    if (!type || !transactionId || !action) {
      return NextResponse.json({ error: 'type, transactionId, and action are required' }, { status: 400 });
    }

    // For reconciliation, we update journal entry status
    if (type === 'journal' && action === 'verify') {
      const entry = await db.journal_entries.findUnique({
        where: { entry_id: parseInt(transactionId) },
      });
      if (!entry) {
        return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 });
      }
      await db.journal_entries.update({
        where: { entry_id: parseInt(transactionId) },
        data: { status: 'verified' },
      });
      return NextResponse.json({ success: true, message: 'Journal entry verified' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Reconciliation action error:', error);
    return NextResponse.json({ error: error.message || 'Action failed' }, { status: 500 });
  }
}
