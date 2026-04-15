import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/reconciliation - Daily reconciliation data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const today = new Date(date);
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const settings = await db.settings.findMany({
      where: { type: { in: ['running_year', 'running_term'] } },
    });
    let year = '', term = '';
    settings.forEach((s: any) => {
      if (s.type === 'running_year') year = s.description;
      if (s.type === 'running_term') term = s.description;
    });

    // Get all transactions for the day
    const transactions = await db.daily_fee_transactions.findMany({
      where: { payment_date: { gte: today, lte: endOfDay } },
      include: {
        student: { select: { student_id: true, name: true, student_code: true } },
      },
      orderBy: { id: 'desc' },
    });

    // Actual totals
    const actual = {
      feeding: transactions.reduce((s, t) => s + t.feeding_amount, 0),
      breakfast: transactions.reduce((s, t) => s + t.breakfast_amount, 0),
      classes: transactions.reduce((s, t) => s + t.classes_amount, 0),
      water: transactions.reduce((s, t) => s + t.water_amount, 0),
      transport: transactions.reduce((s, t) => s + t.transport_amount, 0),
      total: transactions.reduce((s, t) => s + t.total_amount, 0),
      count: transactions.length,
      cash: transactions.filter(t => t.payment_method.toLowerCase().includes('cash')).reduce((s, t) => s + t.total_amount, 0),
      mobileMoney: transactions.filter(t => t.payment_method.toLowerCase().includes('momo') || t.payment_method.toLowerCase().includes('mobile')).reduce((s, t) => s + t.total_amount, 0),
      bankTransfer: transactions.filter(t => t.payment_method.toLowerCase().includes('bank')).reduce((s, t) => s + t.total_amount, 0),
    };

    // Expected totals (based on attendance that day)
    const attendanceRecords = await db.attendance.findMany({
      where: { date: date, year, term, status: 'present' },
    });

    // Get unique student IDs that were present
    const presentStudentIds = [...new Set(attendanceRecords.map((a: any) => a.student_id))];

    // Get their rates
    const enrollments = await db.enroll.findMany({
      where: { student_id: { in: presentStudentIds }, year, term, mute: 0 },
      include: {
        class: { include: { daily_fee_rates: { where: { year, term } } } },
      },
    });

    let expectedFeeding = 0, expectedBreakfast = 0, expectedClasses = 0, expectedWater = 0;
    const enrolledStudentIds = new Set<number>();
    enrollments.forEach((e: any) => {
      enrolledStudentIds.add(e.student_id);
      const rate = e.class?.daily_fee_rates?.[0];
      if (rate) {
        expectedFeeding += rate.feeding_rate || 0;
        expectedBreakfast += rate.breakfast_rate || 0;
        expectedClasses += rate.classes_rate || 0;
        expectedWater += rate.water_rate || 0;
      }
    });

    const expected = {
      feeding: expectedFeeding,
      breakfast: expectedBreakfast,
      classes: expectedClasses,
      water: expectedWater,
      transport: 0,
      total: expectedFeeding + expectedBreakfast + expectedClasses + expectedWater,
      presentCount: presentStudentIds.length,
      enrolledCount: enrolledStudentIds.size,
    };

    // Discrepancies
    const discrepancies = {
      feeding: actual.feeding - expected.feeding,
      breakfast: actual.breakfast - expected.breakfast,
      classes: actual.classes - expected.classes,
      water: actual.water - expected.water,
      total: actual.total - expected.total,
    };

    // Collector summaries
    const collectorMap = new Map<string, any[]>();
    for (const tx of transactions) {
      const collector = tx.collected_by || 'Unknown';
      if (!collectorMap.has(collector)) collectorMap.set(collector, []);
      collectorMap.get(collector)!.push(tx);
    }

    const collectors = Array.from(collectorMap.entries()).map(([name, txs]) => ({
      name,
      transactionCount: txs.length,
      totalCollected: txs.reduce((s, t) => s + t.total_amount, 0),
      cashTotal: txs.filter(t => t.payment_method.toLowerCase().includes('cash')).reduce((s, t) => s + t.total_amount, 0),
      momoTotal: txs.filter(t => t.payment_method.toLowerCase().includes('momo') || t.payment_method.toLowerCase().includes('mobile')).reduce((s, t) => s + t.total_amount, 0),
      uniqueStudents: new Set(txs.map(t => t.student_id)).size,
    }));

    // Hourly breakdown
    const hourlyMap = new Map<string, { count: number; total: number }>();
    transactions.forEach(tx => {
      if (tx.payment_date) {
        const hour = new Date(tx.payment_date).getHours();
        const key = `${String(hour).padStart(2, '0')}:00`;
        const existing = hourlyMap.get(key) || { count: 0, total: 0 };
        existing.count++;
        existing.total += tx.total_amount;
        hourlyMap.set(key, existing);
      }
    });
    const hourlyBreakdown = Array.from(hourlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hour, data]) => ({ hour, ...data }));

    return NextResponse.json({
      date,
      actual,
      expected,
      discrepancies,
      collectors,
      hourlyBreakdown,
      transactions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
