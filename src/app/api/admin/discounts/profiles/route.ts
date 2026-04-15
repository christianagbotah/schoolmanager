import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/discounts/profiles - List profiles (extends existing)
// The existing route handles this, we redirect to that logic

// GET /api/admin/discounts/profiles
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
      orderBy: { profile_id: 'desc' },
    });

    const stats = {
      total: profiles.length,
      active: profiles.filter(p => p.is_active === 1).length,
      inactive: profiles.filter(p => p.is_active === 0).length,
      invoice: profiles.filter(p => p.discount_category === 'invoice').length,
      daily_fees: profiles.filter(p => p.discount_category === 'daily_fees').length,
      assignments: await db.student_discount_assignments.count(),
    };

    return NextResponse.json({ profiles, stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - handled by existing route
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
    if (discount_method) {
      if (discount_method === 'fixed') data.flat_amount = discount_value || 0;
      else data.flat_percentage = discount_value || 0;
    }

    const profile = await db.discount_profiles.create({ data });

    return NextResponse.json({ status: 'success', message: 'Profile created', profile }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - handled by existing route
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile_id, ...data } = body;

    if (!profile_id) {
      return NextResponse.json({ error: 'profile_id required' }, { status: 400 });
    }

    const updateData: any = {};
    if (data.profile_name !== undefined) updateData.profile_name = data.profile_name;
    if (data.discount_category !== undefined) updateData.discount_category = data.discount_category;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.flat_amount !== undefined) updateData.flat_amount = data.flat_amount;
    if (data.flat_percentage !== undefined) updateData.flat_percentage = data.flat_percentage;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    if (data.discount_type !== undefined) updateData.discount_type = typeof data.discount_type === 'string' ? data.discount_type : data.discount_type.join(',');

    if (data.discount_method) {
      if (data.discount_method === 'fixed') updateData.flat_amount = data.discount_value || 0;
      else updateData.flat_percentage = data.discount_value || 0;
    }

    await db.discount_profiles.update({ where: { profile_id }, data: updateData });
    return NextResponse.json({ status: 'success', message: 'Profile updated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - handled by existing route
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
