import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const section = await db.section.findUnique({
      where: { section_id: parseInt(id) },
      include: {
        teacher: true,
        class: true,
        subjects: {
          include: {
            teacher: { select: { teacher_id: true, name: true } },
            class: { select: { class_id: true, name: true } },
          },
        },
        enrolls: {
          include: {
            student: {
              select: { student_id: true, name: true, student_code: true },
            },
          },
        },
      },
    })

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    return NextResponse.json(section)
  } catch (error) {
    console.error('Error fetching section:', error)
    return NextResponse.json({ error: 'Failed to fetch section' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, numeric_name, teacher_id, class_id } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Section name is required' }, { status: 400 })
    }

    const section = await db.section.update({
      where: { section_id: parseInt(id) },
      data: {
        name: name.trim(),
        numeric_name: parseInt(numeric_name) || 0,
        teacher_id: teacher_id ? parseInt(teacher_id) : null,
        class_id: class_id ? parseInt(class_id) : null,
      },
      include: {
        teacher: { select: { teacher_id: true, name: true } },
        class: { select: { class_id: true, name: true } },
      },
    })

    return NextResponse.json(section)
  } catch (error) {
    console.error('Error updating section:', error)
    return NextResponse.json({ error: 'Failed to update section' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.section.delete({
      where: { section_id: parseInt(id) },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting section:', error)
    return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 })
  }
}
