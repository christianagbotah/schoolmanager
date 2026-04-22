import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const classId = searchParams.get('classId') || '';

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dayRange: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dayRange.push(d.toISOString().split('T')[0]);
    }

    // Attendance
    const attendanceWhere: Record<string, unknown> = {
      date: { in: dayRange },
    };
    if (classId) attendanceWhere.class_id = parseInt(classId);

    const attendanceRecords = await db.attendance.findMany({
      where: attendanceWhere,
      select: { student_id: true, status: true, date: true, class_id: true },
    });

    // Group attendance by date
    const attendanceByDate: Record<string, { present: number; absent: number; late: number; total: number }> = {};
    for (const day of dayRange) {
      attendanceByDate[day] = { present: 0, absent: 0, late: 0, total: 0 };
    }

    const seenStudents = new Map<string, Set<number>>();
    for (const rec of attendanceRecords) {
      const key = rec.date;
      if (!attendanceByDate[key]) continue;
      const studentKey = `${key}-${rec.student_id}`;
      if (!seenStudents.has(studentKey)) seenStudents.set(studentKey, new Set());
      seenStudents.get(studentKey)!.add(rec.student_id);

      const entry = attendanceByDate[key];
      entry.total++;
      if (rec.status === 'present') entry.present++;
      else if (rec.status === 'absent') entry.absent++;
      else if (rec.status === 'late') entry.late++;
    }

    const totalPresent = Object.values(attendanceByDate).reduce((s, v) => s + v.present, 0);
    const totalRecords = Object.values(attendanceByDate).reduce((s, v) => s + v.total, 0);
    const attendanceRate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

    // Fee collection for date range
    const feeWhere: Record<string, unknown> = {
      creation_timestamp: { gte: start, lte: end },
    };
    if (classId) feeWhere.class_id = parseInt(classId);

    const [invoices, payments] = await Promise.all([
      db.invoice.findMany({
        where: feeWhere,
        select: { amount: true, amount_paid: true, status: true },
      }),
      db.payment.findMany({
        where: {
          timestamp: { gte: start, lte: end },
          ...(classId ? { invoice: { class_id: parseInt(classId) } } : {}),
        },
        select: { amount: true, payment_method: true },
      }),
    ]);

    const totalInvoiced = invoices.reduce((s, v) => s + v.amount, 0);
    const totalCollected = payments.reduce((s, v) => s + v.amount, 0);
    const totalPending = invoices.reduce((s, v) => s + (v.amount - v.amount_paid), 0);

    // New admissions in range
    const admissionWhere: Record<string, unknown> = {
      admission_date: { gte: start, lte: end },
    };
    const newAdmissions = await db.student.count({ where: admissionWhere });

    // Discipline incidents (penalties)
    const penaltyWhere: Record<string, unknown> = {
      penalty_date: { gte: start, lte: end },
    };
    const incidents = await db.penalty.count({ where: penaltyWhere });

    // Top performers from marks
    const marksWhere: Record<string, unknown> = {};
    if (classId) marksWhere.class_id = parseInt(classId);

    const examMarks = await db.exam_marks.findMany({
      where: marksWhere,
      select: { student_id: true, mark_obtained: true, subject_id: true },
    });

    const studentAvg: Record<number, { total: number; count: number }> = {};
    for (const m of examMarks) {
      if (!studentAvg[m.student_id]) studentAvg[m.student_id] = { total: 0, count: 0 };
      studentAvg[m.student_id].total += m.mark_obtained;
      studentAvg[m.student_id].count++;
    }

    const topStudentIds = Object.entries(studentAvg)
      .map(([sid, data]) => ({
        studentId: parseInt(sid),
        avg: data.count > 0 ? data.total / data.count : 0,
      }))
      .sort((a, b) => b.avg - a.avg);

    const topIds = topStudentIds.slice(0, 5).map((s) => s.studentId);
    const bottomIds = topStudentIds.slice(-5).reverse().map((s) => s.studentId);

    const [topStudents, bottomStudents] = await Promise.all([
      topIds.length > 0
        ? db.student.findMany({
            where: { student_id: { in: topIds } },
            select: { student_id: true, name: true, student_code: true },
          })
        : [],
      bottomIds.length > 0
        ? db.student.findMany({
            where: { student_id: { in: bottomIds } },
            select: { student_id: true, name: true, student_code: true },
          })
        : [],
    ]);

    const avgMap = new Map(topStudentIds.map((s) => [s.studentId, s.avg]));

    const topPerformers = topStudents.map((s) => ({
      name: s.name,
      studentCode: s.student_code,
      average: Math.round((avgMap.get(s.student_id) || 0) * 10) / 10,
    }));

    const bottomPerformers = bottomStudents.map((s) => ({
      name: s.name,
      studentCode: s.student_code,
      average: Math.round((avgMap.get(s.student_id) || 0) * 10) / 10,
    }));

    // Daily chart data
    const chartData = dayRange.map((day) => ({
      date: day,
      label: new Date(day + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      attendanceRate: attendanceByDate[day] && attendanceByDate[day].total > 0
        ? Math.round((attendanceByDate[day].present / attendanceByDate[day].total) * 100)
        : 0,
      present: attendanceByDate[day]?.present || 0,
      absent: attendanceByDate[day]?.absent || 0,
      total: attendanceByDate[day]?.total || 0,
    }));

    return NextResponse.json({
      summary: {
        attendanceRate,
        feesCollected: totalCollected,
        totalInvoiced,
        totalPending,
        newAdmissions,
        incidents,
        totalRecords,
      },
      chartData,
      topPerformers,
      bottomPerformers,
    });
  } catch (error) {
    console.error('Error fetching weekly report:', error);
    return NextResponse.json({ error: 'Failed to fetch weekly report' }, { status: 500 });
  }
}
