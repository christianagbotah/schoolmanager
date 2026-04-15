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

    const [runningYear, runningTerm] = await Promise.all([
      db.settings.findFirst({ where: { type: 'running_year' } }),
      db.settings.findFirst({ where: { type: 'running_term' } }),
    ]);
    const year = runningYear?.description || '';
    const term = runningTerm?.description || '';

    // Get children's class IDs
    const children = await db.student.findMany({
      where: { parent_id: parentId, mute: 0 },
      select: {
        student_id: true,
        name: true,
        first_name: true,
        last_name: true,
        enrolls: {
          where: { year, term },
          select: { class_id: true, class: { select: { name: true, name_numeric: true } } },
        },
      },
    });

    const classIds = children
      .flatMap(c => c.enrolls.map(e => e.class_id))
      .filter((v, i, a) => a.indexOf(v) === i);

    // Get syllabus for children's classes
    const syllabi = classIds.length > 0
      ? await db.academic_syllabus.findMany({
          where: { class_id: { in: classIds } },
          orderBy: { syllabus_id: 'desc' },
          select: {
            syllabus_id: true,
            academic_syllabus_code: true,
            title: true,
            description: true,
            file_name: true,
            file_path: true,
            upload_date: true,
            uploaded_by: true,
            uploader_type: true,
            uploader_id: true,
            subject_id: true,
            class_id: true,
            year: true,
            term: true,
            subject: { select: { name: true } },
            class: { select: { name: true, name_numeric: true } },
          },
        })
      : [];

    return NextResponse.json({ syllabi, children });
  } catch (error) {
    console.error('Parent syllabus error:', error);
    return NextResponse.json({ error: 'Failed to load syllabus' }, { status: 500 });
  }
}
