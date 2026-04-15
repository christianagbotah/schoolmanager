import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    if (status === 'blocked') {
      where.block_limit = 3;
    } else if (status === 'active') {
      where.active_status = 1;
      where.block_limit = { lt: 3 };
    }

    const librarians = await db.librarian.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { librarian_id: 'desc' },
    });

    const total = librarians.length;
    const blocked = librarians.filter(l => l.block_limit === 3).length;
    const active = librarians.filter(l => l.active_status === 1 && l.block_limit < 3).length;

    return NextResponse.json({ data: librarians, stats: { total, blocked, active } });
  } catch (error) {
    console.error('Error fetching librarians:', error);
    return NextResponse.json({ error: 'Failed to fetch librarians' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, password, address } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (email?.trim()) {
      const existing = await db.librarian.findFirst({ where: { email: email.trim().toLowerCase() } });
      if (existing) {
        return NextResponse.json({ error: 'Librarian with this email already exists' }, { status: 409 });
      }
    }

    const authKey = 'L' + Math.random().toString(36).substring(2, 6).toUpperCase();

    const librarian = await db.librarian.create({
      data: {
        name: name.trim().toUpperCase(),
        email: email ? email.trim().toLowerCase() : '',
        phone: phone || '',
        address: address || '',
        password: password || '',
        active_status: 1,
        authentication_key: authKey,
        block_limit: 0,
      },
    });

    return NextResponse.json(librarian, { status: 201 });
  } catch (error) {
    console.error('Error creating librarian:', error);
    return NextResponse.json({ error: 'Failed to create librarian' }, { status: 500 });
  }
}
