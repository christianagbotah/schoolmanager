import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('class_id')

    const where: Record<string, unknown> = {}

    if (classId) {
      where.class_id = parseInt(classId)
    }

    const sections = await db.section.findMany({
      where,
      include: {
        teacher: { select: { teacher_id: true, name: true } },
        class: { select: { class_id: true, name: true } },
        _count: {
          select: { enrolls: true },
        },
      },
      orderBy: [{ numeric_name: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json(sections)
  } catch (error) {
    console.error('Error fetching sections:', error)
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, numeric_name, teacher_id, class_id } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Section name is required' }, { status: 400 })
    }

    const section = await db.section.create({
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

    return NextResponse.json(section, { status: 201 })
  } catch (error) {
    console.error('Error creating section:', error)
    return NextResponse.json({ error: 'Failed to create section' }, { status: 500 })
  }
}
