import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT /api/admin/grades/jhs/[id] - Update a JHS grade
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const grade = await db.grade_2.update({
      where: { grade_2_id: parseInt(id) },
      data: {
        name: body.name ?? undefined,
        comment: body.comment ?? undefined,
        grade_from: body.grade_from !== undefined ? parseFloat(body.grade_from) : undefined,
        grade_to: body.grade_to !== undefined ? parseFloat(body.grade_to) : undefined,
        point: body.point !== undefined ? parseFloat(body.point) : undefined,
      },
    })

    return NextResponse.json(grade)
  } catch (error) {
    console.error('JHS grade PUT error:', error)
    return NextResponse.json({ error: 'Failed to update JHS grade' }, { status: 500 })
  }
}

// DELETE /api/admin/grades/jhs/[id] - Delete a JHS grade
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.grade_2.delete({ where: { grade_2_id: parseInt(id) } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('JHS grade DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete JHS grade' }, { status: 500 })
  }
}
