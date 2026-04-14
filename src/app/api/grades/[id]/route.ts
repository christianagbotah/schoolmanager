import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT /api/grades/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const grade = await db.grade.update({
      where: { grade_id: parseInt(id) },
      data: {
        name: body.name ?? undefined,
        comment: body.comment ?? undefined,
        grade_from: body.grade_from !== undefined ? parseFloat(body.grade_from) : undefined,
        grade_to: body.grade_to !== undefined ? parseFloat(body.grade_to) : undefined,
      },
    })

    return NextResponse.json(grade)
  } catch (error) {
    console.error('Grade PUT error:', error)
    return NextResponse.json({ error: 'Failed to update grade' }, { status: 500 })
  }
}

// DELETE /api/grades/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.grade.delete({ where: { grade_id: parseInt(id) } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Grade DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete grade' }, { status: 500 })
  }
}
