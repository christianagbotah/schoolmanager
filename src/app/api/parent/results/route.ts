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
    const examId = searchParams.get('exam_id');

    // Get children
    const children = await db.student.findMany({
      where: { parent_id: parentId },
      select: { student_id: true, name: true, first_name: true, last_name: true, student_code: true, sex: true, mute: true },
    });
    const childIds = children.map(c => c.student_id);

    if (childIds.length === 0) {
      return NextResponse.json({ children: [], exams: [], marks: [] });
    }

    // Get current year/term
    const [runningYear, runningTerm] = await Promise.all([
      db.settings.findFirst({ where: { type: 'running_year' } }),
      db.settings.findFirst({ where: { type: 'running_term' } }),
    ]);
    const year = runningYear?.description || '';
    const term = runningTerm?.description || '';

    // Get exams available for these children
    const enrollments = await db.enroll.findMany({
      where: { student_id: { in: childIds } },
      select: { class_id: true, section_id: true },
      distinct: ['class_id', 'section_id'],
    });
    const classIds = enrollments.map(e => e.class_id);

    const exams = classIds.length > 0
      ? await db.exam.findMany({
          where: { class_id: { in: classIds } },
          select: { exam_id: true, name: true, date: true, year: true, term: true, type: true },
          orderBy: { date: 'desc' },
        })
      : [];

    // Get marks
    let marksWhere: Record<string, unknown> = { student_id: { in: childIds } };
    if (studentId) marksWhere.student_id = parseInt(studentId);
    if (examId) marksWhere.exam_id = parseInt(examId);

    const marks = await db.mark.findMany({
      where: marksWhere,
      select: {
        mark_id: true,
        student_id: true,
        mark_obtained: true,
        comment: true,
        class_id: true,
        subject_id: true,
        exam_id: true,
        subject: { select: { subject_id: true, name: true } },
        exam: { select: { exam_id: true, name: true } },
      },
    });

    // Get grades
    const grades = await db.grade.findMany({
      orderBy: { grade_from: 'asc' },
    });

    return NextResponse.json({ children, exams, marks, grades });
  } catch (error) {
    console.error('Parent results error:', error);
    return NextResponse.json({ error: 'Failed to load results' }, { status: 500 });
  }
}
