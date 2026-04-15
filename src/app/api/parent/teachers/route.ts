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

    const [runningYear, runningTerm] = await Promise.all([
      db.settings.findFirst({ where: { type: 'running_year' } }),
      db.settings.findFirst({ where: { type: 'running_term' } }),
    ]);
    const year = runningYear?.description || '';
    const term = runningTerm?.description || '';

    // Get children with their class IDs
    const children = await db.student.findMany({
      where: { parent_id: parentId, mute: 0 },
      select: {
        student_id: true,
        name: true,
        first_name: true,
        last_name: true,
        student_code: true,
        enrolls: {
          where: { year, term },
          select: {
            class_id: true,
            section_id: true,
            class: { select: { class_id: true, name: true, name_numeric: true, teacher_id: true } },
            section: { select: { section_id: true, name: true } },
          },
        },
      },
    });

    const classIds = children
      .flatMap(c => c.enrolls.map(e => e.class_id))
      .filter((v, i, a) => a.indexOf(v) === i);

    // Class masters (teachers assigned to classes)
    const classMasters: Array<{
      teacher_id: number;
      name: string;
      email: string;
      phone: string;
      gender: string;
      class_id: number;
      class_name: string;
      class_name_numeric: number;
      class_section: string;
      student_name: string;
      student_id: number;
    }> = [];

    if (classIds.length > 0) {
      const classesWithTeachers = await db.school_class.findMany({
        where: { class_id: { in: classIds } },
        select: { class_id: true, name: true, name_numeric: true, teacher_id: true },
      });

      for (const cls of classesWithTeachers) {
        if (!cls.teacher_id) continue;
        const teacher = await db.teacher.findUnique({
          where: { teacher_id: cls.teacher_id },
          select: { teacher_id: true, name: true, email: true, phone: true, gender: true },
        });
        if (!teacher) continue;

        // Find which child belongs to this class
        const childForClass = children.find(c => c.enrolls.some(e => e.class_id === cls.class_id));
        const sectionName = childForClass?.enrolls.find(e => e.class_id === cls.class_id)?.section?.name || '';

        classMasters.push({
          ...teacher,
          class_id: cls.class_id,
          class_name: cls.name,
          class_name_numeric: cls.name_numeric,
          class_section: sectionName,
          student_name: childForClass?.name || `${childForClass?.first_name} ${childForClass?.last_name}`.trim() || '',
          student_id: childForClass?.student_id || 0,
        });
      }
    }

    // Subject teachers
    const subjectTeachers: Array<{
      teacher_id: number;
      name: string;
      email: string;
      phone: string;
      gender: string;
      subject_name: string;
      class_name: string;
      class_name_numeric: number;
      student_name: string;
      student_id: number;
    }> = [];

    if (classIds.length > 0) {
      const subjects = await db.subject.findMany({
        where: {
          class_id: { in: classIds },
          year,
          teacher_id: { not: null },
        },
        select: {
          subject_id: true,
          name: true,
          teacher_id: true,
          class_id: true,
          teacher: { select: { teacher_id: true, name: true, email: true, phone: true, gender: true } },
          class: { select: { name: true, name_numeric: true } },
        },
      });

      for (const subj of subjects) {
        if (!subj.teacher) continue;
        const childForClass = children.find(c => c.enrolls.some(e => e.class_id === subj.class_id));

        subjectTeachers.push({
          teacher_id: subj.teacher.teacher_id,
          name: subj.teacher.name,
          email: subj.teacher.email,
          phone: subj.teacher.phone,
          gender: subj.teacher.gender,
          subject_name: subj.name,
          class_name: subj.class?.name || '',
          class_name_numeric: subj.class?.name_numeric || 0,
          student_name: childForClass?.name || `${childForClass?.first_name} ${childForClass?.last_name}`.trim() || '',
          student_id: childForClass?.student_id || 0,
        });
      }
    }

    return NextResponse.json({ classMasters, subjectTeachers, children });
  } catch (error) {
    console.error('Parent teachers error:', error);
    return NextResponse.json({ error: 'Failed to load teachers' }, { status: 500 });
  }
}
