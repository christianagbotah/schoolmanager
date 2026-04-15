import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '100');
    const status = searchParams.get('status') || 'running';

    const where: Record<string, unknown> = {};
    if (status === 'running') where.status = 1;
    else if (status === 'archived') where.status = 0;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { notice: { contains: search } },
      ];
    }
    // Filter visibility for parents
    where.show_on_website = 1;
    where.visibility_roles = { in: ['all', 'parents'] };

    const notices = await db.notice.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        notice: true,
        timestamp: true,
        start_date: true,
        end_date: true,
        image: true,
        attachment: true,
        check_sms: true,
        sms_target: true,
        status: true,
      },
    });

    const total = await db.notice.count({ where });

    return NextResponse.json({ notices, total, stats: { total, running: total } });
  } catch (error) {
    console.error('Parent notices error:', error);
    return NextResponse.json({ error: 'Failed to load notices' }, { status: 500 });
  }
}
