import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/attendance - List attendance with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const classId = searchParams.get('class_id')
    const sectionId = searchParams.get('section_id')
    const studentId = searchParams.get('student_id')
    const date = searchParams.get('date')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: Record<string, unknown> = {}

    if (classId) where.class_id = parseInt(classId)
    if (sectionId) where.section_id = parseInt(sectionId)
    if (studentId) where.student_id = parseInt(studentId)

    if (date) {
      const startDate = new Date(date + 'T00:00:00.000Z')
      const endDate = new Date(date + 'T23:59:59.999Z')
      where.timestamp = { gte: startDate, lte: endDate }
    } else if (dateFrom && dateTo) {
      where.timestamp = {
        gte: new Date(dateFrom + 'T00:00:00.000Z'),
        lte: new Date(dateTo + 'T23:59:59.999Z'),
      }
    }

    const skip = (page - 1) * limit

    const [records, total] = await Promise.all([
      db.attendance.findMany({
        where,
        include: {
          student: {
            select: { student_id: true, student_code: true, name: true, first_name: true, last_name: true },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      db.attendance.count({ where }),
    ])

    return NextResponse.json({
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Attendance GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
  }
}

// POST /api/attendance - Save attendance (batch upsert)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { class_id, section_id, date, records, year, term, marked_by } = body

    if (!class_id || !section_id || !date || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Missing required fields: class_id, section_id, date, records' }, { status: 400 })
    }

    const timestamp = new Date(date + 'T00:00:00.000Z')

    let count = 0
    for (const record of records) {
      if (!record.student_id || !record.status) continue

      // Upsert: find existing or create new
      const existing = await db.attendance.findFirst({
        where: {
          student_id: record.student_id,
          class_id,
          section_id,
          timestamp: {
            gte: new Date(date + 'T00:00:00.000Z'),
            lte: new Date(date + 'T23:59:59.999Z'),
          },
        },
      })

      if (existing) {
        await db.attendance.update({
          where: { attendance_id: existing.attendance_id },
          data: {
            status: record.status,
            marked_by: marked_by || 'admin',
          },
        })
      } else {
        await db.attendance.create({
          data: {
            student_id: record.student_id,
            class_id,
            section_id,
            timestamp,
            year: year || new Date().getFullYear().toString(),
            term: term || '',
            status: record.status,
            marked_by: marked_by || 'admin',
          },
        })
      }
      count++
    }

    return NextResponse.json({ success: true, count })
  } catch (error) {
    console.error('Attendance POST error:', error)
    return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 })
  }
}
