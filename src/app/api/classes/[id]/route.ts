import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const schoolClass = await db.school_class.findUnique({
      where: { class_id: parseInt(id) },
      include: {
        teacher: true,
        section: true,
        sections: true,
        subjects: {
          include: {
            teacher: { select: { teacher_id: true, name: true } },
            section: true,
          },
        },
        enrolls: {
          include: {
            student: {
              select: { student_id: true, name: true, student_code: true, sex: true },
            },
          },
        },
      },
    })

    if (!schoolClass) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    return NextResponse.json(schoolClass)
  } catch (error) {
    console.error('Error fetching class:', error)
    return NextResponse.json({ error: 'Failed to fetch class' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, name_numeric, category, teacher_id, student_capacity, digit, note, section_id } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Class name is required' }, { status: 400 })
    }

    const schoolClass = await db.school_class.update({
      where: { class_id: parseInt(id) },
      data: {
        name: name.trim(),
        name_numeric: parseInt(name_numeric) || 0,
        category: category || '',
        teacher_id: teacher_id ? parseInt(teacher_id) : null,
        student_capacity: parseInt(student_capacity) || 0,
        digit: digit || '',
        note: note || '',
        section_id: section_id ? parseInt(section_id) : null,
      },
      include: {
        teacher: { select: { teacher_id: true, name: true } },
        section: true,
      },
    })

    return NextResponse.json(schoolClass)
  } catch (error) {
    console.error('Error updating class:', error)
    return NextResponse.json({ error: 'Failed to update class' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.school_class.delete({
      where: { class_id: parseInt(id) },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting class:', error)
    return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 })
  }
}
