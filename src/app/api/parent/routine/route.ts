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

    const [runningYear, runningTerm] = await Promise.all([
      db.settings.findFirst({ where: { type: 'running_year' } }),
      db.settings.findFirst({ where: { type: 'running_term' } }),
    ]);
    const year = runningYear?.description || '';
    const term = runningTerm?.description || '';

    // Get children
    const children = await db.student.findMany({
      where: { parent_id: parentId, mute: 0 },
      select: {
        student_id: true,
        name: true,
        first_name: true,
        last_name: true,
        enrolls: {
          where: { year, term },
          select: {
            class_id: true,
            section_id: true,
            class: { select: { class_id: true, name: true, name_numeric: true } },
            section: { select: { section_id: true, name: true } },
          },
        },
      },
    });

    if (children.length === 0) {
      return NextResponse.json({ children: [], routines: [] });
    }

    // Get section IDs for children
    let targetStudentId: number | null = null;
    let sectionIds: number[] = [];

    if (studentId) {
      targetStudentId = parseInt(studentId);
    } else if (children.length > 0) {
      targetStudentId = children[0].student_id;
    }

    const targetChild = children.find(c => c.student_id === targetStudentId);
    if (targetChild) {
      sectionIds = targetChild.enrolls.map(e => e.section_id);
    }

    if (sectionIds.length === 0) {
      return NextResponse.json({ children, routines: [] });
    }

    // Get routines for the child's sections
    const routines = await db.class_routine.findMany({
      where: { section_id: { in: sectionIds } },
      orderBy: [{ day: 'asc' }, { time_start: 'asc' }],
      select: {
        class_routine_id: true,
        section_id: true,
        subject_id: true,
        time_start: true,
        time_end: true,
        day: true,
        room: true,
        subject: { select: { name: true } },
        section: { select: { name: true } },
      },
    });

    return NextResponse.json({ children, routines, selectedStudentId: targetStudentId, year, term });
  } catch (error) {
    console.error('Parent routine error:', error);
    return NextResponse.json({ error: 'Failed to load routine' }, { status: 500 });
  }
}
