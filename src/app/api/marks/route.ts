import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/marks
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const examId = searchParams.get('exam_id')
    const classId = searchParams.get('class_id')
    const subjectId = searchParams.get('subject_id')
    const studentId = searchParams.get('student_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: Record<string, unknown> = {}
    if (examId) where.exam_id = parseInt(examId)
    if (classId) where.class_id = parseInt(classId)
    if (subjectId) where.subject_id = parseInt(subjectId)
    if (studentId) where.student_id = parseInt(studentId)

    const skip = (page - 1) * limit

    const [marks, total] = await Promise.all([
      db.mark.findMany({
        where,
        include: {
          student: { select: { student_id: true, name: true, student_code: true } },
          subject: { select: { subject_id: true, name: true } },
          class: { select: { class_id: true, name: true } },
          exam: { select: { exam_id: true, name: true } },
        },
        orderBy: { mark_id: 'desc' },
        skip,
        take: limit,
      }),
      db.mark.count({ where }),
    ])

    return NextResponse.json({
      marks,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Marks GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch marks' }, { status: 500 })
  }
}

// POST /api/marks - Batch upsert marks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { records } = body

    if (!records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'records array is required' }, { status: 400 })
    }

    let count = 0
    for (const record of records) {
      if (!record.student_id || !record.subject_id) continue

      // Upsert: find existing mark or create new
      const existing = await db.mark.findFirst({
        where: {
          student_id: record.student_id,
          subject_id: record.subject_id,
          exam_id: record.exam_id || null,
          class_id: record.class_id || null,
        },
      })

      if (existing) {
        await db.mark.update({
          where: { mark_id: existing.mark_id },
          data: {
            mark_obtained: record.mark_obtained ?? 0,
            comment: record.comment ?? '',
            class_id: record.class_id ?? existing.class_id,
            section_id: record.section_id ?? existing.section_id,
            exam_id: record.exam_id ?? existing.exam_id,
          },
        })
      } else {
        await db.mark.create({
          data: {
            student_id: record.student_id,
            subject_id: record.subject_id,
            class_id: record.class_id || null,
            section_id: record.section_id || null,
            exam_id: record.exam_id || null,
            mark_obtained: record.mark_obtained ?? 0,
            comment: record.comment || '',
          },
        })
      }
      count++
    }

    return NextResponse.json({ success: true, count })
  } catch (error) {
    console.error('Marks POST error:', error)
    return NextResponse.json({ error: 'Failed to save marks' }, { status: 500 })
  }
}

// PUT /api/marks - Update single mark
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { mark_id, mark_obtained, comment } = body

    if (!mark_id) {
      return NextResponse.json({ error: 'mark_id is required' }, { status: 400 })
    }

    const mark = await db.mark.update({
      where: { mark_id },
      data: {
        mark_obtained: mark_obtained ?? undefined,
        comment: comment ?? undefined,
      },
    })

    return NextResponse.json(mark)
  } catch (error) {
    console.error('Marks PUT error:', error)
    return NextResponse.json({ error: 'Failed to update mark' }, { status: 500 })
  }
}
