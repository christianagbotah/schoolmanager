import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')
    const admin = await db.admin.findUnique({ where: { admin_id: id } })
    if (!admin) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(admin)
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')
    const body = await request.json()
    const admin = await db.admin.update({
      where: { admin_id: id },
      data: {
        name: body.name || undefined,
        email: body.email || undefined,
        phone: body.phone || undefined,
        level: body.level || undefined,
        ...(body.password ? { password: body.password } : {}),
      },
    })
    return NextResponse.json(admin)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')
    await db.admin.delete({ where: { admin_id: id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
