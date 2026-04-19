import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/exams/[id] - Get exam details with marks
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const exam = await db.exam.findUnique({
      where: { exam_id: parseInt(id) },
      include: {
        class: { select: { class_id: true, name: true, name_numeric: true, category: true } },
        marks_list: {
          include: {
            student: { select: { student_id: true, name: true, student_code: string } },
            subject: { select: { subject_id: true, name: string } },
          },
        },
        exam_marks: {
          include: {
            student: { select: { student_id: true, name: true, student_code: string } },
            subject: { select: { subject_id: true, name: string } },
          },
        },
      },
    })

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    return NextResponse.json(exam)
  } catch (error) {
    console.error('Admin Exam GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch exam' }, { status: 500 })
  }
}

// PUT /api/admin/exams/[id] - Update exam
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.exam.findUnique({ where: { exam_id: parseInt(id) } })
    if (!existing) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    const exam = await db.exam.update({
      where: { exam_id: parseInt(id) },
      data: {
        name: body.name ?? existing.name,
        date: body.date ? new Date(body.date + 'T00:00:00.000Z') : existing.date,
        comment: body.comment ?? existing.comment,
        year: body.year ?? existing.year,
        class_id: body.class_id !== undefined ? (body.class_id || null) : existing.class_id,
        section_id: body.section_id !== undefined ? (body.section_id || null) : existing.section_id,
        type: body.type ?? existing.type,
      },
      include: {
        class: { select: { class_id: true, name: true, category: true, name_numeric: true } },
      },
    })

    return NextResponse.json({ exam, message: 'Exam updated successfully' })
  } catch (error) {
    console.error('Admin Exam PUT error:', error)
    return NextResponse.json({ error: 'Failed to update exam' }, { status: 500 })
  }
}

// DELETE /api/admin/exams/[id] - Delete exam and all associated marks
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.exam.findUnique({ where: { exam_id: parseInt(id) } })
    if (!existing) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    await db.mark.deleteMany({ where: { exam_id: parseInt(id) } })
    await db.examMarks.deleteMany({ where: { exam_id: parseInt(id) } })
    await db.exam.delete({ where: { exam_id: parseInt(id) } })

    return NextResponse.json({ message: 'Exam and associated marks deleted successfully' })
  } catch (error) {
    console.error('Admin Exam DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete exam' }, { status: 500 })
  }
}
