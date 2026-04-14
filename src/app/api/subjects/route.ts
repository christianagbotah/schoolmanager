import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('class_id')
    const teacherId = searchParams.get('teacher_id')
    const sectionId = searchParams.get('section_id')

    const where: Record<string, unknown> = {}

    if (classId) {
      where.class_id = parseInt(classId)
    }

    if (teacherId) {
      where.teacher_id = parseInt(teacherId)
    }

    if (sectionId) {
      where.section_id = parseInt(sectionId)
    }

    const subjects = await db.subject.findMany({
      where,
      include: {
        class: { select: { class_id: true, name: true } },
        teacher: { select: { teacher_id: true, name: true } },
        section: { select: { section_id: true, name: true } },
      },
      orderBy: { subject_id: 'desc' },
    })

    return NextResponse.json(subjects)
  } catch (error) {
    console.error('Error fetching subjects:', error)
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, class_id, teacher_id, section_id, year } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Subject name is required' }, { status: 400 })
    }

    const subject = await db.subject.create({
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

    return NextResponse.json(subject, { status: 201 })
  } catch (error) {
    console.error('Error creating subject:', error)
    return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 })
  }
}
