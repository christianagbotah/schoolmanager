import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { des_name } = body

    if (!des_name || !des_name.trim()) {
      return NextResponse.json({ error: 'Designation name is required' }, { status: 400 })
    }

    const designation = await db.designation.update({
      where: { id: parseInt(id) },
      data: { des_name: des_name.trim() },
    })

    return NextResponse.json(designation)
  } catch (error) {
    console.error('Error updating designation:', error)
    return NextResponse.json({ error: 'Failed to update designation' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.designation.delete({
      where: { id: parseInt(id) },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting designation:', error)
    return NextResponse.json({ error: 'Failed to delete designation' }, { status: 500 })
  }
}
