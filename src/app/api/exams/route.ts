import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/exams
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const classId = searchParams.get('class_id')
    const type = searchParams.get('type')
    const year = searchParams.get('year')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    if (classId) where.class_id = parseInt(classId)
    if (type) where.type = type
    if (year) where.year = year

    const skip = (page - 1) * limit

    const [exams, total] = await Promise.all([
      db.exam.findMany({
        where,
        include: {
          class: {
            select: { class_id: true, name: true, category: true },
          },
        },
        orderBy: [{ date: 'desc' }, { exam_id: 'desc' }],
        skip,
        take: limit,
      }),
      db.exam.count({ where }),
    ])

    return NextResponse.json({
      exams,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Exams GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 })
  }
}

// POST /api/exams
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, date, comment, year, class_id, section_id, type } = body

    if (!name) {
      return NextResponse.json({ error: 'Exam name is required' }, { status: 400 })
    }

    const exam = await db.exam.create({
      data: {
        name,
        date: date ? new Date(date + 'T00:00:00.000Z') : null,
        comment: comment || '',
        year: year || new Date().getFullYear().toString(),
        class_id: class_id || null,
        section_id: section_id || null,
        type: type || '',
      },
      include: { class: { select: { class_id: true, name: true, category: true } } },
    })

    return NextResponse.json(exam, { status: 201 })
  } catch (error) {
    console.error('Exams POST error:', error)
    return NextResponse.json({ error: 'Failed to create exam' }, { status: 500 })
  }
}
