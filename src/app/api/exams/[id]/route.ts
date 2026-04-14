import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/exams/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const exam = await db.exam.findUnique({
      where: { exam_id: parseInt(id) },
      include: {
        class: { select: { class_id: true, name: true, category: true } },
        marks_list: {
          include: {
            student: { select: { student_id: true, name: true, student_code: true } },
            subject: { select: { subject_id: true, name: true } },
          },
        },
      },
    })

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    return NextResponse.json(exam)
  } catch (error) {
    console.error('Exam GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch exam' }, { status: 500 })
  }
}

// PUT /api/exams/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const exam = await db.exam.update({
      where: { exam_id: parseInt(id) },
      data: {
        name: body.name,
        date: body.date ? new Date(body.date + 'T00:00:00.000Z') : null,
        comment: body.comment ?? undefined,
        year: body.year ?? undefined,
        class_id: body.class_id ?? null,
        section_id: body.section_id ?? null,
        type: body.type ?? undefined,
      },
      include: { class: { select: { class_id: true, name: true, category: true } } },
    })

    return NextResponse.json(exam)
  } catch (error) {
    console.error('Exam PUT error:', error)
    return NextResponse.json({ error: 'Failed to update exam' }, { status: 500 })
  }
}

// DELETE /api/exams/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.mark.deleteMany({ where: { exam_id: parseInt(id) } })
    await db.exam.delete({ where: { exam_id: parseInt(id) } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Exam DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete exam' }, { status: 500 })
  }
}
