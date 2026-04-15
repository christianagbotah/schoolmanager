import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const parentId = parseInt(session.user.id);
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const month = searchParams.get('month');
    const yearParam = searchParams.get('year');

    // Get children IDs
    const children = await db.student.findMany({
      where: { parent_id: parentId },
      select: { student_id: true },
    });
    const childIds = children.map(c => c.student_id);

    if (childIds.length === 0) {
      return NextResponse.json({ records: [], summary: {} });
    }

    // Build where clause
    const where: Record<string, unknown> = { student_id: { in: childIds } };

    if (studentId) {
      where.student_id = parseInt(studentId);
    }
    if (month && yearParam) {
      const monthInt = parseInt(month);
      const prefix = `${yearParam}-${String(monthInt).padStart(2, '0')}`;
      where.date = { startsWith: prefix };
    }

    const records = await db.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      select: {
        attendance_id: true,
        student_id: true,
        status: true,
        date: true,
        timestamp: true,
      },
    });

    // Summary per child
    const summary: Record<number, { present: number; absent: number; late: number; sick_home: number; sick_clinic: number; total: number; pct: number }> = {};
    for (const childId of childIds) {
      const childRecords = records.filter(r => r.student_id === childId);
      const present = childRecords.filter(r => r.status === '1').length;
      const absent = childRecords.filter(r => r.status === '2').length;
      const late = childRecords.filter(r => r.status === '3').length;
      const sickHome = childRecords.filter(r => r.status === '4').length;
      const sickClinic = childRecords.filter(r => r.status === '5').length;
      const total = childRecords.length;
      summary[childId] = {
        present,
        absent,
        late,
        sick_home: sickHome,
        sick_clinic: sickClinic,
        total,
        pct: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
      };
    }

    // Get student names
    const students = await db.student.findMany({
      where: { student_id: { in: childIds } },
      select: { student_id: true, name: true, first_name: true, last_name: true, student_code: true },
    });
    const studentMap: Record<number, string> = {};
    for (const s of students) {
      studentMap[s.student_id] = s.name || `${s.first_name} ${s.last_name}`.trim();
    }

    return NextResponse.json({ records, summary, studentMap });
  } catch (error) {
    console.error('Parent attendance error:', error);
    return NextResponse.json({ error: 'Failed to load attendance' }, { status: 500 });
  }
}
