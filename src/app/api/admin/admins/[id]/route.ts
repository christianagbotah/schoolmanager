import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await db.admin.findUnique({ where: { admin_id: parseInt(id) } });
    if (!admin) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(admin);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name, first_name, other_name, last_name, email, phone, gender,
      level, password, account_number, address,
    } = body;

    const fName = (first_name || '').trim().toUpperCase();
    const oName = (other_name || '').trim().toUpperCase();
    const lName = (last_name || '').trim().toUpperCase();
    const fullName = name?.trim() || [fName, oName, lName].filter(Boolean).join(' ') || '';

    if (email) {
      const existing = await db.admin.findFirst({
        where: { email: email?.trim().toLowerCase(), admin_id: { not: parseInt(id) } },
      });
      if (existing) {
        return NextResponse.json({ error: 'Email already in use by another admin' }, { status: 409 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (fullName) updateData.name = fullName.toUpperCase();
    if (fName) updateData.first_name = fName;
    if (oName) updateData.other_name = oName;
    if (lName) updateData.last_name = lName;
    if (email) updateData.email = email.trim().toLowerCase();
    if (phone !== undefined) updateData.phone = phone;
    if (gender !== undefined) updateData.gender = gender;
    if (level) {
      updateData.level = level;
      if (['1', '2', '3', '4'].includes(level)) {
        updateData.can_collect_daily_fees = 1;
        updateData.collection_point = 'office';
        updateData.transport_only = 0;
      } else if (level === '5') {
        updateData.can_collect_daily_fees = 1;
        updateData.collection_point = 'bus';
        updateData.transport_only = 1;
      }
    }
    if (password) updateData.password = password;
    if (account_number !== undefined) updateData.account_number = account_number;
    if (address !== undefined) updateData.account_number = address;

    const admin = await db.admin.update({
      where: { admin_id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json(admin);
  } catch (error) {
    console.error('Error updating admin:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'block') {
      await db.admin.update({
        where: { admin_id: parseInt(id) },
        data: { active_status: 0, block_limit: 3 },
      });
      return NextResponse.json({ success: true, message: 'Admin blocked successfully' });
    }

    if (action === 'unblock') {
      const admin = await db.admin.update({
        where: { admin_id: parseInt(id) },
        data: { active_status: 1, block_limit: 0 },
      });
      return NextResponse.json({ success: true, message: 'Admin unblocked successfully', auth_key: admin.authentication_key });
    }

    // Prevent deleting the last super admin
    const targetAdmin = await db.admin.findUnique({ where: { admin_id: parseInt(id) } });
    if (targetAdmin?.level === '1') {
      const superAdmins = await db.admin.findMany({ where: { level: '1' } });
      if (superAdmins.length <= 1) {
        return NextResponse.json({ error: 'Cannot delete the last super administrator' }, { status: 400 });
      }
    }

    await db.admin.delete({ where: { admin_id: parseInt(id) } });
    return NextResponse.json({ success: true, message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
