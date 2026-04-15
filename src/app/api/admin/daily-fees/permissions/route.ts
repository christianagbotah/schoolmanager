import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Build permissions list from admins and teachers
    const admins = await db.admin.findMany({
      where: { active_status: 1, can_collect_daily_fees: 1 },
      select: { admin_id: true, name: true, collection_point: true },
    });

    const teachers = await db.teacher.findMany({
      where: { active_status: 1 },
      select: { teacher_id: true, name: true },
    });

    const permissions = [];

    // Admin permissions
    for (const admin of admins) {
      permissions.push({
        id: admin.admin_id,
        user_type: 'admin' as const,
        user_id: admin.admin_id,
        user_name: admin.name,
        fee_types: ['feeding', 'breakfast', 'classes', 'water', 'transport'],
        collection_point: admin.collection_point || '',
        is_active: true,
      });
    }

    // Teacher permissions (none by default, could have settings entries)
    const permSettings = await db.settings.findMany({
      where: { type: 'fee_permission' },
    });

    for (const setting of permSettings) {
      try {
        const data = JSON.parse(setting.value);
        if (data.user_type === 'teacher') {
          permissions.push({
            id: setting.settings_id,
            user_type: 'teacher' as const,
            user_id: data.user_id,
            user_name: teachers.find(t => t.teacher_id === data.user_id)?.name || `Teacher #${data.user_id}`,
            fee_types: data.fee_types || [],
            collection_point: data.collection_point || '',
            is_active: data.is_active !== false,
          });
        }
      } catch {
        // skip invalid
      }
    }

    return NextResponse.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_type, user_id, fee_types, collection_point } = body;

    if (!user_id || !fee_types || fee_types.length === 0) {
      return NextResponse.json({ error: 'User ID and fee types are required' }, { status: 400 });
    }

    // Store as setting
    await db.settings.create({
      data: {
        type: 'fee_permission',
        description: `${user_type}_${user_id}`,
        value: JSON.stringify({ user_type, user_id, fee_types, collection_point, is_active: true }),
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error creating permission:', error);
    return NextResponse.json({ error: 'Failed to create permission' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const setting = await db.settings.findUnique({ where: { settings_id: id } });
    if (!setting) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
    }

    try {
      const data = JSON.parse(setting.value);
      data.is_active = is_active;
      await db.settings.update({
        where: { settings_id: id },
        data: { value: JSON.stringify(data) },
      });
    } catch {
      return NextResponse.json({ error: 'Invalid permission data' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating permission:', error);
    return NextResponse.json({ error: 'Failed to update permission' }, { status: 500 });
  }
}
