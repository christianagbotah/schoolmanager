import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const parentId = parseInt(session.user.id);

    // Get parent info
    const parent = await db.parent.findUnique({
      where: { parent_id: parentId },
      select: { parent_id: true, name: true, email: true, phone: true },
    });
    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    // Get settings
    const [runningYear, runningTerm] = await Promise.all([
      db.settings.findFirst({ where: { type: 'running_year' } }),
      db.settings.findFirst({ where: { type: 'running_term' } }),
    ]);
    const year = runningYear?.description || '';
    const term = runningTerm?.description || '';

    // Get children with enrollment
    const children = await db.student.findMany({
      where: { parent_id: parentId },
      select: {
        student_id: true,
        student_code: true,
        name: true,
        first_name: true,
        last_name: true,
        sex: true,
        birthday: true,
        mute: true,
        enrolls: {
          where: { year, term },
          select: {
            class_id: true,
            section_id: true,
            year: true,
            term: true,
            class: { select: { class_id: true, name: true, name_numeric: true, teacher_id: true } },
            section: { select: { section_id: true, name: true } },
          },
        },
      },
    });

    const activeStudentIds = children.filter(c => c.mute === 0).map(c => c.student_id);
    const allStudentIds = children.map(c => c.student_id);

    // Get today's attendance
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = allStudentIds.length > 0
      ? await db.attendance.findMany({
          where: {
            student_id: { in: allStudentIds },
            date: today,
            status: '1',
          },
          select: { student_id: true },
        })
      : [];
    const presentToday = todayAttendance.length;

    // Get class teacher IDs for children
    const classIds = children
      .flatMap(c => c.enrolls.map(e => e.class_id))
      .filter((v, i, a) => a.indexOf(v) === i);

    const classTeacherIds = classIds.length > 0
      ? await db.school_class.findMany({
          where: { class_id: { in: classIds } },
          select: { teacher_id: true },
        })
      : [];
    const teacherIds = classTeacherIds
      .map(c => c.teacher_id)
      .filter((v): v is number => v !== null && v !== undefined);

    const classMasterCount = teacherIds.length > 0
      ? await db.teacher.count({ where: { teacher_id: { in: teacherIds } } })
      : 0;

    // Subject teacher count
    const subjectTeacherCount = teacherIds.length > 0
      ? await db.subject.count({
          where: { teacher_id: { in: teacherIds }, class_id: { in: classIds } },
        })
      : 0;

    // Fee balances
    const invoices = allStudentIds.length > 0
      ? await db.invoice.findMany({
          where: {
            student_id: { in: allStudentIds },
            can_delete: { not: 'trash' },
          },
          select: { student_id: true, due: true, amount: true, amount_paid: true },
        })
      : [];

    const feeBalances: Record<number, number> = {};
    let totalBilled = 0;
    let totalPaid = 0;
    let totalDue = 0;
    for (const inv of invoices) {
      feeBalances[inv.student_id] = (feeBalances[inv.student_id] || 0) + (inv.due || 0);
      totalBilled += inv.amount || 0;
      totalPaid += inv.amount_paid || 0;
      totalDue += inv.due || 0;
    }

    // Attendance summary per child (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysStr = thirtyDaysAgo.toISOString().split('T')[0];

    const recentAttendance = activeStudentIds.length > 0
      ? await db.attendance.findMany({
          where: {
            student_id: { in: activeStudentIds },
            date: { gte: thirtyDaysStr },
          },
          select: { student_id: true, status: true },
        })
      : [];

    const attendanceSummary: Record<number, { present: number; absent: number; total: number; pct: number }> = {};
    for (const child of children) {
      if (child.mute !== 0) continue;
      const records = recentAttendance.filter(r => r.student_id === child.student_id);
      const present = records.filter(r => r.status === '1' || r.status === '3').length;
      const absent = records.filter(r => r.status === '2').length;
      const total = records.length;
      attendanceSummary[child.student_id] = {
        present,
        absent,
        total,
        pct: total > 0 ? Math.round((present / total) * 100) : 0,
      };
    }

    // Recent notices
    const notices = await db.notice.findMany({
      where: { status: 1, show_on_website: 1 },
      orderBy: { timestamp: 'desc' },
      take: 5,
      select: { id: true, title: true, notice: true, timestamp: true },
    });

    return NextResponse.json({
      parent,
      children,
      stats: {
        totalChildren: children.length,
        activeChildren: activeStudentIds.length,
        inactiveChildren: children.length - activeStudentIds.length,
        presentToday,
        classMasterCount,
        subjectTeacherCount,
        totalBilled,
        totalPaid,
        totalDue,
      },
      feeBalances,
      attendanceSummary,
      notices,
    });
  } catch (error) {
    console.error('Parent dashboard error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
