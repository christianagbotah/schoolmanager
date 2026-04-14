import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { dep_name } = body

    if (!dep_name || !dep_name.trim()) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 })
    }

    const department = await db.department.update({
      where: { id: parseInt(id) },
      data: { dep_name: dep_name.trim() },
    })

    return NextResponse.json(department)
  } catch (error) {
    console.error('Error updating department:', error)
    return NextResponse.json({ error: 'Failed to update department' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.department.delete({
      where: { id: parseInt(id) },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting department:', error)
    return NextResponse.json({ error: 'Failed to delete department' }, { status: 500 })
  }
}
