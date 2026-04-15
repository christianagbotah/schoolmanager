import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/admin/attendance/quick-mark
 * Quick mark all students present. Mirrors CI3 Attendance_enterprise::quick_mark_present()
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { class_id, section_id, date } = body

    if (!class_id || !date) {
      return NextResponse.json(
        { status: 'error', message: 'class_id and date are required' },
        { status: 400 }
      )
    }

    // Get settings
    const settings = await db.settings.findMany({
      where: { type: { in: ['running_year', 'running_term'] } },
    })
    const year = settings.find(s => s.type === 'running_year')?.description || new Date().getFullYear().toString()
    const term = settings.find(s => s.type === 'running_term')?.description || ''

    // Get enrolled students
    const enrollWhere: Record<string, unknown> = {
      class_id: parseInt(class_id),
    }
    if (year) enrollWhere.year = year
    if (term) enrollWhere.term = term
    if (sectionId) enrollWhere.section_id = parseInt(section_id)

    const enrollments = await db.enroll.findMany({
      where: enrollWhere,
      select: { student_id: true },
    })

    if (enrollments.length === 0) {
      return NextResponse.json(
        { status: 'error', message: 'No students enrolled in this class' },
        { status: 400 }
      )
    }

    const timestamp = new Date(date + 'T00:00:00.000Z')
    const nextDay = new Date(date + 'T23:59:59.999Z')

    let count = 0
    for (const e of enrollments) {
      // Check if already marked
      const existing = await db.attendance.findFirst({
        where: {
          student_id: e.student_id,
          class_id,
          timestamp: { gte: timestamp, lte: nextDay },
        },
      })

      if (existing) {
        await db.attendance.update({
          where: { attendance_id: existing.attendance_id },
          data: { status: '1' },
        })
      } else {
        await db.attendance.create({
          data: {
            student_id: e.student_id,
            class_id,
            section_id: section_id ? parseInt(section_id) : null,
            timestamp,
            year,
            term,
            status: '1', // Present
            date,
          },
        })
      }
      count++
    }

    return NextResponse.json({
      status: 'success',
      message: `All ${count} students marked present`,
      count,
    })
  } catch (error) {
    console.error('[Admin Attendance Quick Mark API] Error:', error)
    return NextResponse.json(
      { status: 'error', message: 'Failed to quick mark attendance' },
      { status: 500 }
    )
  }
}
