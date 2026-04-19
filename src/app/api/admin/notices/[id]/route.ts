import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/notices/[id] - Get a single notice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const notice = await db.notice.findUnique({
      where: { id: parseInt(id) },
    });

    if (!notice) {
      return NextResponse.json({ error: 'Notice not found' }, { status: 404 });
    }

    return NextResponse.json(notice);
  } catch (error) {
    console.error('Error fetching notice:', error);
    return NextResponse.json({ error: 'Failed to fetch notice' }, { status: 500 });
  }
}

// PUT /api/admin/notices/[id] - Update a notice
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const noticeId = parseInt(id);
    const body = await request.json();

    const existing = await db.notice.findUnique({ where: { id: noticeId } });
    if (!existing) {
      return NextResponse.json({ error: 'Notice not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.notice !== undefined) updateData.notice = body.notice;
    if (body.create_timestamp !== undefined) {
      const d = new Date(body.create_timestamp);
      updateData.create_timestamp = Math.floor(d.getTime() / 1000);
      updateData.timestamp = d;
    }
    if (body.start_date !== undefined) updateData.start_date = body.start_date ? new Date(body.start_date) : null;
    if (body.end_date !== undefined) updateData.end_date = body.end_date ? new Date(body.end_date) : null;
    if (body.image !== undefined) updateData.image = body.image;
    if (body.attachment !== undefined) updateData.attachment = body.attachment;
    if (body.show_on_website !== undefined) updateData.show_on_website = body.show_on_website ? 1 : 0;
    if (body.visibility_roles !== undefined) updateData.visibility_roles = body.visibility_roles;
    if (body.check_sms !== undefined) updateData.check_sms = body.check_sms;
    if (body.sms_target !== undefined) updateData.sms_target = body.sms_target;
    if (body.check_email !== undefined) updateData.check_email = body.check_email;
    if (body.status !== undefined) updateData.status = body.status;
    updateData.notice_timestamp = new Date();

    const updated = await db.notice.update({
      where: { id: noticeId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating notice:', error);
    return NextResponse.json({ error: 'Failed to update notice' }, { status: 500 });
  }
}

// DELETE /api/admin/notices/[id] - Delete a notice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const noticeId = parseInt(id);

    const existing = await db.notice.findUnique({ where: { id: noticeId } });
    if (!existing) {
      return NextResponse.json({ error: 'Notice not found' }, { status: 404 });
    }

    await db.notice.delete({ where: { id: noticeId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notice:', error);
    return NextResponse.json({ error: 'Failed to delete notice' }, { status: 500 });
  }
}
