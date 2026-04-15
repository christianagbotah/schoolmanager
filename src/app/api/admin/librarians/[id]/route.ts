import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const librarian = await db.librarian.findUnique({ where: { librarian_id: parseInt(id) } });
    if (!librarian) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(librarian);
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
    const { name, email, phone, password, address } = body;

    if (email?.trim()) {
      const existing = await db.librarian.findFirst({
        where: { email: email.trim().toLowerCase(), librarian_id: { not: parseInt(id) } },
      });
      if (existing) {
        return NextResponse.json({ error: 'Email already in use by another librarian' }, { status: 409 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name.trim().toUpperCase();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (password) updateData.password = password;

    const librarian = await db.librarian.update({
      where: { librarian_id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json(librarian);
  } catch (error) {
    console.error('Error updating librarian:', error);
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
      await db.librarian.update({
        where: { librarian_id: parseInt(id) },
        data: { active_status: 0, block_limit: 3 },
      });
      return NextResponse.json({ success: true, message: 'Librarian blocked successfully' });
    }

    if (action === 'unblock') {
      const librarian = await db.librarian.update({
        where: { librarian_id: parseInt(id) },
        data: { active_status: 1, block_limit: 0 },
      });
      return NextResponse.json({ success: true, message: 'Librarian unblocked successfully', auth_key: librarian.authentication_key });
    }

    await db.librarian.delete({ where: { librarian_id: parseInt(id) } });
    return NextResponse.json({ success: true, message: 'Librarian deleted successfully' });
  } catch (error) {
    console.error('Error deleting librarian:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
