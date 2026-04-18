import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    const startOfYear = new Date(parseInt(year), 0, 1);
    const endOfYear = new Date(parseInt(year), 11, 31, 23, 59, 59);

    // Total students, teachers
    const [totalStudents, totalTeachers, totalClasses] = await Promise.all([
      db.student.count({ where: { active_status: 1 } }),
      db.teacher.count({ where: { active_status: 1 } }),
      db.school_class.count(),
    ]);

    // Enrollment by month
    const studentsByMonth = await db.student.findMany({
      where: {
        admission_date: { gte: startOfYear, lte: endOfYear },
        active_status: 1,
      },
      select: { admission_date: true },
    });

    const enrollmentByMonth: Record<number, number> = {};
    for (let i = 0; i < 12; i++) enrollmentByMonth[i] = 0;
    for (const s of studentsByMonth) {
      if (s.admission_date) {
        const m = s.admission_date.getMonth();
        enrollmentByMonth[m]++;
      }
    }

    const enrollmentTrend = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(parseInt(year), i, 1).toLocaleDateString('en-US', { month: 'short' }),
      count: enrollmentByMonth[i],
    }));

    // Financial summary
    const [invoiceSummary, expenseSummary] = await Promise.all([
      db.invoice.aggregate({
        _sum: { amount: true, amount_paid: true, due: true },
        _count: { invoice_id: true },
      }),
      db.expense.aggregate({
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const totalRevenue = invoiceSummary._sum.amount_paid || 0;
    const totalExpenses = expenseSummary._sum.amount || 0;
    const totalInvoiced = invoiceSummary._sum.amount || 0;
    const totalOutstanding = invoiceSummary._sum.due || 0;

    // Income vs expenses by month
    const paymentsByMonth = await db.payment.findMany({
      where: { timestamp: { gte: startOfYear, lte: endOfYear } },
      select: { amount: true, timestamp: true },
    });

    const expensesByMonthData = await db.expense.findMany({
      where: { expense_date: { gte: startOfYear, lte: endOfYear } },
      select: { amount: true, expense_date: true },
    });

    const incomeByMonth: Record<number, number> = {};
    const expenseByMonth: Record<number, number> = {};
    for (let i = 0; i < 12; i++) { incomeByMonth[i] = 0; expenseByMonth[i] = 0; }

    for (const p of paymentsByMonth) {
      if (p.timestamp) incomeByMonth[p.timestamp.getMonth()] += p.amount;
    }
    for (const e of expensesByMonthData) {
      if (e.expense_date) expenseByMonth[e.expense_date.getMonth()] += e.amount;
    }

    const financialChart = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(parseInt(year), i, 1).toLocaleDateString('en-US', { month: 'short' }),
      income: incomeByMonth[i],
      expense: expenseByMonth[i],
    }));

    // Academic performance: class averages from terminal reports
    const terminalReports = await db.terminal_reports.findMany({
      where: { year: String(year) },
      select: { total_score: true, grade: true, class_id: true, student_id: true },
    });

    const classPerformance: Record<number, { total: number; count: number; grades: Record<string, number> }> = {};
    for (const r of terminalReports) {
      const cid = r.class_id || 0;
      if (!classPerformance[cid]) classPerformance[cid] = { total: 0, count: 0, grades: {} };
      classPerformance[cid].total += r.total_score;
      classPerformance[cid].count++;
      if (r.grade) {
        classPerformance[cid].grades[r.grade] = (classPerformance[cid].grades[r.grade] || 0) + 1;
      }
    }

    const classIds = Object.keys(classPerformance).map(Number);
    const classData = classIds.length > 0
      ? await db.school_class.findMany({
          where: { class_id: { in: classIds } },
          select: { class_id: true, name: true },
        })
      : [];

    const classNameMap = new Map(classData.map((c) => [c.class_id, c.name]));

    const academicPerformance = classIds.map((cid) => {
      const perf = classPerformance[cid];
      return {
        classId: cid,
        className: classNameMap.get(cid) || `Class ${cid}`,
        average: perf.count > 0 ? Math.round((perf.total / perf.count) * 10) / 10 : 0,
        studentCount: perf.count,
        gradeDistribution: perf.grades,
      };
    }).sort((a, b) => b.average - a.average);

    // Overall school average
    const overallAvg = terminalReports.length > 0
      ? Math.round((terminalReports.reduce((s, r) => s + r.total_score, 0) / terminalReports.length) * 10) / 10
      : 0;

    // Grade distribution across the school
    const schoolGrades: Record<string, number> = {};
    for (const r of terminalReports) {
      if (r.grade) {
        schoolGrades[r.grade] = (schoolGrades[r.grade] || 0) + 1;
      }
    }

    return NextResponse.json({
      summary: {
        totalStudents,
        totalTeachers,
        totalClasses,
        totalRevenue,
        totalExpenses,
        totalInvoiced,
        totalOutstanding,
        netProfit: totalRevenue - totalExpenses,
        overallAverage: overallAvg,
      },
      enrollmentTrend,
      financialChart,
      academicPerformance,
      gradeDistribution: schoolGrades,
    });
  } catch (error) {
    console.error('Error fetching annual report:', error);
    return NextResponse.json({ error: 'Failed to fetch annual report' }, { status: 500 });
  }
}
