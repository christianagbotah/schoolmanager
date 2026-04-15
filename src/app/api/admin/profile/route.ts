import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Return first admin as a demo (real auth would use session)
    const admin = await db.admin.findFirst({
      where: { active_status: 1 },
      orderBy: { admin_id: 'asc' },
    });

    if (!admin) {
      return NextResponse.json({ error: 'No admin found' }, { status: 404 });
    }

    return NextResponse.json(admin);
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, gender } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const admin = await db.admin.findFirst({ where: { active_status: 1 } });
    if (!admin) {
      return NextResponse.json({ error: 'No admin found' }, { status: 404 });
    }

    // Split name into parts
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

    await db.admin.update({
      where: { admin_id: admin.admin_id },
      data: {
        name,
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || '',
        gender: gender || '',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // Handle file upload (profile picture)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      // In production, upload to storage and get URL
      return NextResponse.json({ success: true, path: `/uploads/profile/${file.name}` });
    }

    const body = await request.json();
    const { action, current_password, new_password, confirm_password } = body;

    if (action === 'change_password') {
      if (!current_password || !new_password) {
        return NextResponse.json({ error: 'Current and new password required' }, { status: 400 });
      }
      if (new_password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }

      const admin = await db.admin.findFirst({ where: { active_status: 1 } });
      if (!admin) {
        return NextResponse.json({ error: 'No admin found' }, { status: 404 });
      }

      if (current_password !== admin.password) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }

      await db.admin.update({
        where: { admin_id: admin.admin_id },
        data: { password: new_password },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing profile request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
