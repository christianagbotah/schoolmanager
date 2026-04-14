import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')
    const parent = await db.parent.findUnique({
      where: { parent_id: id },
      include: { students: { select: { student_id: true, name: true, student_code: true } } },
    })
    if (!parent) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(parent)
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')
    const body = await request.json()
    const parent = await db.parent.update({
      where: { parent_id: id },
      data: {
        name: body.name || undefined,
        guardian_gender: body.guardian_gender || undefined,
        email: body.email || undefined,
        phone: body.phone || undefined,
        address: body.address || undefined,
        profession: body.profession || undefined,
        father_name: body.father_name || undefined,
        father_phone: body.father_phone || undefined,
        mother_name: body.mother_name || undefined,
        mother_phone: body.mother_phone || undefined,
      },
    })
    return NextResponse.json(parent)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')
    await db.parent.delete({ where: { parent_id: id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
