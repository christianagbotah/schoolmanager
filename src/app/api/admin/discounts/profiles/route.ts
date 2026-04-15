import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/discounts/profiles - List all profiles with stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (category) where.discount_category = category;
    if (status === '1') where.is_active = 1;
    if (status === '0') where.is_active = 0;
    if (search) where.profile_name = { contains: search };

    const profiles = await db.discount_profiles.findMany({
      where,
      include: {
        assignments: {
          include: {
            student: { select: { student_id: true, name: true, student_code: true } },
          },
          take: 5,
        },
      },
      orderBy: { profile_id: 'desc' },
    });

    // Stats
    const total = await db.discount_profiles.count();
    const active = await db.discount_profiles.count({ where: { is_active: 1 } });
    const inactive = await db.discount_profiles.count({ where: { is_active: 0 } });
    const invoice = await db.discount_profiles.count({ where: { discount_category: 'invoice' } });
    const daily = await db.discount_profiles.count({ where: { discount_category: 'daily_fees' } });
    const totalAssignments = await db.student_discount_assignments.count();

    return NextResponse.json({
      profiles,
      stats: { total, active, inactive, invoice, daily_fees: daily, assignments: totalAssignments },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/discounts/profiles - Create profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile_name, discount_category, discount_type, flat_amount, flat_percentage, description, discount_method, discount_value } = body;

    if (!profile_name || !discount_category) {
      return NextResponse.json({ error: 'profile_name and discount_category required' }, { status: 400 });
    }

    const data: any = {
      profile_name,
      discount_category,
      description: description || '',
      flat_amount: flat_amount || 0,
      flat_percentage: flat_percentage || 0,
      is_active: 1,
    };

    if (discount_type) data.discount_type = typeof discount_type === 'string' ? discount_type : discount_type.join(',');
    if (discount_method) data.discount_method = discount_method;
    if (discount_value !== undefined) {
      if (discount_method === 'fixed') data.flat_amount = discount_value;
      else data.flat_percentage = discount_value;
    }

    const profile = await db.discount_profiles.create({ data });

    return NextResponse.json({ status: 'success', message: 'Profile created', profile });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/discounts/profiles - Update profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile_id, profile_name, discount_category, discount_type, flat_amount, flat_percentage, description, discount_method, discount_value, is_active } = body;

    if (!profile_id) {
      return NextResponse.json({ error: 'profile_id required' }, { status: 400 });
    }

    const data: any = {};
    if (profile_name !== undefined) data.profile_name = profile_name;
    if (discount_category !== undefined) data.discount_category = discount_category;
    if (description !== undefined) data.description = description;
    if (flat_amount !== undefined) data.flat_amount = flat_amount;
    if (flat_percentage !== undefined) data.flat_percentage = flat_percentage;
    if (is_active !== undefined) data.is_active = is_active;
    if (discount_type !== undefined) data.discount_type = typeof discount_type === 'string' ? discount_type : discount_type.join(',');
    if (discount_method) data.discount_method = discount_method;
    if (discount_value !== undefined) {
      if (discount_method === 'fixed') data.flat_amount = discount_value;
      else data.flat_percentage = discount_value;
    }

    await db.discount_profiles.update({ where: { profile_id }, data });

    return NextResponse.json({ status: 'success', message: 'Profile updated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/discounts/profiles - Toggle status or delete
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = parseInt(searchParams.get('id') || '0');
    const action = searchParams.get('action') || 'delete';

    if (!profileId) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    if (action === 'toggle') {
      const current = await db.discount_profiles.findUnique({ where: { profile_id: profileId } });
      if (current) {
        await db.discount_profiles.update({
          where: { profile_id: profileId },
          data: { is_active: current.is_active ? 0 : 1 },
        });
        return NextResponse.json({ status: 'success', message: current.is_active ? 'Profile deactivated' : 'Profile activated' });
      }
    }

    await db.student_discount_assignments.deleteMany({ where: { profile_id: profileId } });
    await db.discount_profiles.delete({ where: { profile_id: profileId } });

    return NextResponse.json({ status: 'success', message: 'Profile deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
