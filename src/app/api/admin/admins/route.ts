import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const level = searchParams.get('level');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { admin_code: { contains: search } },
      ];
    }
    if (level) where.level = level;
    if (status === 'blocked') {
      where.block_limit = 3;
    } else if (status === 'active') {
      where.active_status = 1;
      where.block_limit = { lt: 3 };
    }

    const admins = await db.admin.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { admin_id: 'desc' },
    });

    // Compute stats
    const total = admins.length;
    const blocked = admins.filter(a => a.block_limit === 3).length;
    const active = admins.filter(a => a.active_status === 1 && a.block_limit < 3).length;
    const inactive = total - active - blocked;

    return NextResponse.json({ data: admins, stats: { total, blocked, active, inactive } });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name, first_name, other_name, last_name, email, phone, gender,
      level, password, account_number, address,
    } = body;

    const fName = (first_name || '').trim().toUpperCase();
    const oName = (other_name || '').trim().toUpperCase();
    const lName = (last_name || '').trim().toUpperCase();
    const fullName = name?.trim() || [fName, oName, lName].filter(Boolean).join(' ') || '';

    if (!fullName || !email?.trim()) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }
    if (!level) {
      return NextResponse.json({ error: 'Designation level is required' }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const existing = await db.admin.findFirst({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: 'Admin with this email already exists' }, { status: 409 });
    }

    const authKey = process.env.NODE_ENV === 'production'
      ? Math.random().toString(36).substring(2, 7).toUpperCase()
      : 'A' + Math.random().toString(36).substring(2, 6).toUpperCase();

    // Set daily fee collection privileges based on level
    let canCollect = 0;
    let collectionPoint = '';
    let transportOnly = 0;
    const lvl = level;

    if (['1', '2', '3', '4'].includes(lvl)) {
      canCollect = 1;
      collectionPoint = 'office';
    }
    if (lvl === '5') {
      canCollect = 1;
      collectionPoint = 'bus';
      transportOnly = 1;
    }

    const admin = await db.admin.create({
      data: {
        admin_code: '',
        name: fullName.toUpperCase(),
        first_name: fName,
        other_name: oName,
        last_name: lName,
        email: email.trim().toLowerCase(),
        phone: phone || '',
        gender: gender || '',
        level: lvl,
        password: password,
        active_status: 1,
        authentication_key: authKey,
        account_number: account_number || '',
        block_limit: 0,
        can_collect_daily_fees: canCollect,
        collection_point: collectionPoint,
        transport_only: transportOnly,
      },
    });

    // Update admin code after creation
    const adminCode = `ADM-${admin.admin_id}`;
    await db.admin.update({
      where: { admin_id: admin.admin_id },
      data: { admin_code: adminCode },
    });

    return NextResponse.json({ ...admin, admin_code: adminCode }, { status: 201 });
  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
  }
}
