import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search') || '';

    const where: Record<string, unknown> = {
      active_status: 1,
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const parents = await db.parent.findMany({
      where,
      orderBy: { parent_id: 'desc' },
      take: 20,
    });
    return NextResponse.json({ parents });
  } catch (error) {
    console.error('Error fetching parents:', error);
    return NextResponse.json({ error: 'Failed to fetch parents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone } = body;

    const parent = await db.parent.create({
      data: {
        name: name || '',
        email: email || '',
        phone: phone || '',
        password: '',
      },
    });

    return NextResponse.json({ parent }, { status: 201 });
  } catch (error) {
    console.error('Error creating parent:', error);
    return NextResponse.json({ error: 'Failed to create parent' }, { status: 500 });
  }
}
