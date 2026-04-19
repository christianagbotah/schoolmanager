import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT /api/admin/grades/creche/[id] - Update a creche grade
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const grade = await db.grade_creche.update({
      where: { grade_creche_id: parseInt(id) },
      data: {
        name: body.name ?? undefined,
        abbrev: body.abbrev ?? undefined,
        grade_from: body.grade_from !== undefined ? parseFloat(body.grade_from) : undefined,
        grade_to: body.grade_to !== undefined ? parseFloat(body.grade_to) : undefined,
        comment: body.comment ?? undefined,
      },
    })

    return NextResponse.json(grade)
  } catch (error) {
    console.error('Creche grade PUT error:', error)
    return NextResponse.json({ error: 'Failed to update creche grade' }, { status: 500 })
  }
}

// DELETE /api/admin/grades/creche/[id] - Delete a creche grade by ID param
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.grade_creche.delete({ where: { grade_creche_id: parseInt(id) } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Creche grade DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete creche grade' }, { status: 500 })
  }
}
