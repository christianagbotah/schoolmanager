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

    const children = await db.student.findMany({
      where: { parent_id: parentId },
      select: {
        student_id: true,
        student_code: true,
        name: true,
        first_name: true,
        middle_name: true,
        last_name: true,
        sex: true,
        birthday: true,
        email: true,
        phone: true,
        address: true,
        mute: true,
        active_status: true,
        enrolls: {
          where: { year, term },
          select: {
            class_id: true,
            section_id: true,
            year: true,
            term: true,
            mute: true,
            class: { select: { class_id: true, name: true, name_numeric: true, category: true } },
            section: { select: { section_id: true, name: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ children, year, term });
  } catch (error) {
    console.error('Parent children error:', error);
    return NextResponse.json({ error: 'Failed to load children' }, { status: 500 });
  }
}
