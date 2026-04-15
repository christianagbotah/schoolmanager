import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/collection-efficiency - Efficiency metrics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';

    const settings = await db.settings.findMany({
      where: { type: { in: ['running_year', 'running_term'] } },
    });
    let year = '', term = '';
    settings.forEach((s: any) => {
      if (s.type === 'running_year') year = s.description;
      if (s.type === 'running_term') term = s.description;
    });

    // Date range
    const now = new Date();
    let startDate: Date;
    if (period === 'today') {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 90);
      startDate.setHours(0, 0, 0, 0);
    }

    // Get total enrolled students
    const enrolledStudents = await db.enroll.findMany({
      where: { year, term, mute: 0 },
      include: {
        class: {
          select: { class_id: true, name: true, name_numeric: true, category: true },
          include: { daily_fee_rates: { where: { year, term } } },
        },
      },
    });

    // Expected per day rates
    let totalDailyExpected = 0;
    const classExpected: Record<string, number> = {};
    const classCounts: Record<string, number> = {};
    const feeTypeExpected = { feeding: 0, breakfast: 0, classes: 0, water: 0 };

    enrolledStudents.forEach((e: any) => {
      const rate = e.class?.daily_fee_rates?.[0];
      const classKey = `${e.class?.name || ''} ${e.class?.name_numeric || ''}`;
      classCounts[classKey] = (classCounts[classKey] || 0) + 1;

      if (rate) {
        const dayTotal = (rate.feeding_rate || 0) + (rate.breakfast_rate || 0) + (rate.classes_rate || 0) + (rate.water_rate || 0);
        totalDailyExpected += dayTotal;
        classExpected[classKey] = (classExpected[classKey] || 0) + dayTotal;
        feeTypeExpected.feeding += rate.feeding_rate || 0;
        feeTypeExpected.breakfast += rate.breakfast_rate || 0;
        feeTypeExpected.classes += rate.classes_rate || 0;
        feeTypeExpected.water += rate.water_rate || 0;
      }
    });

    // Actual collections
    const transactions = await db.daily_fee_transactions.findMany({
      where: { payment_date: { gte: startDate, lte: now } },
    });

    // Calculate school days in period
    const daysDiff = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const schoolDays = Math.max(1, Math.floor(daysDiff * 5 / 7)); // Approximate

    const totalExpected = totalDailyExpected * schoolDays;
    const actualTotal = transactions.reduce((s, t) => s + t.total_amount, 0);
    const overallEfficiency = totalExpected > 0 ? (actualTotal / totalExpected) * 100 : 0;

    // By fee type
    const feeTypeActual = {
      feeding: transactions.reduce((s, t) => s + t.feeding_amount, 0),
      breakfast: transactions.reduce((s, t) => s + t.breakfast_amount, 0),
      classes: transactions.reduce((s, t) => s + t.classes_amount, 0),
      water: transactions.reduce((s, t) => s + t.water_amount, 0),
      transport: transactions.reduce((s, t) => s + t.transport_amount, 0),
    };

    const feeTypeEfficiency = {
      feeding: feeTypeExpected.feeding > 0 ? ((feeTypeActual.feeding / (feeTypeExpected.feeding * schoolDays)) * 100) : 0,
      breakfast: feeTypeExpected.breakfast > 0 ? ((feeTypeActual.breakfast / (feeTypeExpected.breakfast * schoolDays)) * 100) : 0,
      classes: feeTypeExpected.classes > 0 ? ((feeTypeActual.classes / (feeTypeExpected.classes * schoolDays)) * 100) : 0,
      water: feeTypeExpected.water > 0 ? ((feeTypeActual.water / (feeTypeExpected.water * schoolDays)) * 100) : 0,
    };

    // By class
    const classActual: Record<string, number> = {};
    // Group transactions by class via student enrollment
    const studentClassMap = new Map<number, string>();
    enrolledStudents.forEach((e: any) => {
      const classKey = `${e.class?.name || ''} ${e.class?.name_numeric || ''}`;
      studentClassMap.set(e.student_id, classKey);
    });

    transactions.forEach(tx => {
      const classKey = studentClassMap.get(tx.student_id) || 'Unknown';
      classActual[classKey] = (classActual[classKey] || 0) + tx.total_amount;
    });

    const classEfficiency = Object.entries(classExpected).map(([className, expected]) => ({
      className,
      expectedDaily: expected,
      expectedTotal: expected * schoolDays,
      actual: classActual[className] || 0,
      efficiency: expected > 0 ? ((classActual[className] || 0) / (expected * schoolDays)) * 100 : 0,
      students: classCounts[className] || 0,
    })).sort((a, b) => b.efficiency - a.efficiency);

    // Daily trend
    const dailyMap = new Map<string, number>();
    transactions.forEach(tx => {
      if (tx.payment_date) {
        const key = new Date(tx.payment_date).toISOString().split('T')[0];
        dailyMap.set(key, (dailyMap.get(key) || 0) + tx.total_amount);
      }
    });

    const dailyTrend = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ date, actual: total, expected: totalDailyExpected }));

    // Unique students who paid
    const uniquePayers = new Set(transactions.map(t => t.student_id)).size;
    const totalEnrolled = enrolledStudents.length;
    const studentCoverage = totalEnrolled > 0 ? (uniquePayers / totalEnrolled) * 100 : 0;

    // Payment method distribution
    const cashTotal = transactions.filter(t => t.payment_method.toLowerCase().includes('cash')).reduce((s, t) => s + t.total_amount, 0);
    const momoTotal = transactions.filter(t => t.payment_method.toLowerCase().includes('momo') || t.payment_method.toLowerCase().includes('mobile')).reduce((s, t) => s + t.total_amount, 0);
    const bankTotal = transactions.filter(t => t.payment_method.toLowerCase().includes('bank')).reduce((s, t) => s + t.total_amount, 0);

    return NextResponse.json({
      period,
      schoolDays,
      totalEnrolled,
      summary: {
        totalExpected,
        totalActual: actualTotal,
        overallEfficiency: Math.min(overallEfficiency, 100),
        uniquePayers,
        studentCoverage: Math.min(studentCoverage, 100),
        totalTransactions: transactions.length,
      },
      feeTypeEfficiency: {
        expected: feeTypeExpected,
        actual: feeTypeActual,
        efficiency: feeTypeEfficiency,
      },
      classEfficiency,
      dailyTrend,
      paymentMethods: {
        cash: cashTotal,
        mobileMoney: momoTotal,
        bankTransfer: bankTotal,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
