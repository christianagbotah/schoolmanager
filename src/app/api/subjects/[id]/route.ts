import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const subject = await db.subject.findUnique({
      where: { subject_id: parseInt(id) },
      include: {
        class: true,
        teacher: true,
        section: true,
      },
    })

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    return NextResponse.json(subject)
  } catch (error) {
    console.error('Error fetching subject:', error)
    return NextResponse.json({ error: 'Failed to fetch subject' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, class_id, teacher_id, section_id, year } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Subject name is required' }, { status: 400 })
    }

    const subject = await db.subject.update({
      where: { subject_id: parseInt(id) },
      data: {
        name: name.trim(),
        class_id: class_id ? parseInt(class_id) : null,
        teacher_id: teacher_id ? parseInt(teacher_id) : null,
        section_id: section_id ? parseInt(section_id) : null,
        year: year || '',
      },
      include: {
        class: { select: { class_id: true, name: true } },
        teacher: { select: { teacher_id: true, name: true } },
        section: { select: { section_id: true, name: true } },
      },
    })

    return NextResponse.json(subject)
  } catch (error) {
    console.error('Error updating subject:', error)
    return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.subject.delete({
      where: { subject_id: parseInt(id) },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting subject:', error)
    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 })
  }
}
