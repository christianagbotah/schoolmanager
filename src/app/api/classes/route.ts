import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category')

    const where: Record<string, unknown> = {}

    if (search) {
      where.name = { contains: search }
    }

    if (category) {
      where.category = category
    }

    const classes = await db.school_class.findMany({
      where,
      include: {
        teacher: { select: { teacher_id: true, name: true, email: true } },
        section: true,
        sections: true,
        subjects: { select: { subject_id: true, name: true } },
        _count: {
          select: { enrolls: true },
        },
      },
      orderBy: [{ name_numeric: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json(classes)
  } catch (error) {
    console.error('Error fetching classes:', error)
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, name_numeric, category, teacher_id, student_capacity, digit, note, section_id } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Class name is required' }, { status: 400 })
    }

    const schoolClass = await db.school_class.create({
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

    return NextResponse.json(schoolClass, { status: 201 })
  } catch (error) {
    console.error('Error creating class:', error)
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 })
  }
}
