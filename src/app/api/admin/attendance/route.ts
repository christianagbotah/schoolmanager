import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/admin/attendance
 * Dashboard stats, mark attendance student loading, and attendance records.
 * Mirrors CI3 Attendance::get_stats() + Attendance_enterprise::get_student_data()
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || ''
    const classId = searchParams.get('class_id')
    const sectionId = searchParams.get('section_id')
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // ---- ACTION: stats ----
    // Mirrors CI3 Attendance::get_stats()
    if (action === 'stats') {
      const timestamp = new Date(date + 'T00:00:00.000Z')
      const nextDay = new Date(date + 'T23:59:59.999Z')

      // Get running year/term
      const settings = await db.settings.findMany({
        where: { type: { in: ['running_year', 'running_term'] } },
      })
      const runningYear = settings.find(s => s.type === 'running_year')?.description || ''
      const runningTerm = settings.find(s => s.type === 'running_term')?.description || ''

      // Total enrolled
      const enrollWhere: Record<string, unknown> = {}
      if (runningYear) enrollWhere.year = runningYear
      if (runningTerm) enrollWhere.term = runningTerm
      const totalEnrolled = await db.enroll.count({ where: enrollWhere })

      // Daily attendance stats
      const attendanceRecords = await db.attendance.findMany({
        where: {
          timestamp: { gte: timestamp, lte: nextDay },
        },
        select: { status: true },
      })

      const present = attendanceRecords.filter(r => r.status === '1').length
      const absent = attendanceRecords.filter(r => r.status === '2').length
      const late = attendanceRecords.filter(r => r.status === '3').length
      const sickHome = attendanceRecords.filter(r => r.status === '4').length
      const sickClinic = attendanceRecords.filter(r => r.status === '5').length
      const totalAbsent = absent + sickHome + sickClinic

      const presentPercent = totalEnrolled > 0 ? Math.round((present / totalEnrolled) * 1000) / 10 : 0
      const absentPercent = totalEnrolled > 0 ? Math.round((totalAbsent / totalEnrolled) * 1000) / 10 : 0

      // Stats by class
      const classStats = await db.school_class.findMany({
        where: {},
        include: {
          _count: { select: { enrolls: true } },
        },
        orderBy: [{ category: 'asc' }, { name_numeric: 'asc' }, { name: 'asc' }],
      })

      const byClass = []
      for (const cls of classStats) {
        const classAttendance = await db.attendance.findMany({
          where: {
            class_id: cls.class_id,
            timestamp: { gte: timestamp, lte: nextDay },
          },
          include: {
            student: { select: { name: true } },
          },
        })

        const classPresent = classAttendance.filter(r => r.status === '1').length
        const classAbsent = classAttendance.filter(r => r.status === '2').length
        const classLate = classAttendance.filter(r => r.status === '3').length
        const classSickHome = classAttendance.filter(r => r.status === '4').length
        const classSickClinic = classAttendance.filter(r => r.status === '5').length

        byClass.push({
          class_id: cls.class_id,
          class_name: `${cls.name}${cls.name_numeric ? ' ' + cls.name_numeric : ''}`,
          total: cls._count.enrolls,
          present: classPresent,
          absent: classAbsent,
          late: classLate,
          sick_home: classSickHome,
          sick_clinic: classSickClinic,
          present_students: classAttendance.filter(r => r.status === '1').map(r => r.student.name).filter(Boolean),
          absent_students: classAttendance.filter(r => r.status === '2').map(r => r.student.name).filter(Boolean),
          late_students: classAttendance.filter(r => r.status === '3').map(r => r.student.name).filter(Boolean),
          sick_home_students: classAttendance.filter(r => r.status === '4').map(r => r.student.name).filter(Boolean),
          sick_clinic_students: classAttendance.filter(r => r.status === '5').map(r => r.student.name).filter(Boolean),
        })
      }

      return NextResponse.json({
        status: 'success',
        data: {
          total: totalEnrolled,
          present,
          absent: totalAbsent,
          late,
          sick_home: sickHome,
          sick_clinic: sickClinic,
          present_percent: presentPercent,
          absent_percent: absentPercent,
          by_class: byClass,
        },
      })
    }

    // ---- ACTION: students ----
    // Mirrors CI3 Attendance_enterprise::get_student_data()
    if (action === 'students') {
      if (!classId) {
        return NextResponse.json({ error: 'class_id is required' }, { status: 400 })
      }

      const settings = await db.settings.findMany({
        where: { type: { in: ['running_year', 'running_term'] } },
      })
      const runningYear = settings.find(s => s.type === 'running_year')?.description || ''
      const runningTerm = settings.find(s => s.type === 'running_term')?.description || ''

      const enrollWhere: Record<string, unknown> = {
        class_id: parseInt(classId),
      }
      if (runningYear) enrollWhere.year = runningYear
      if (runningTerm) enrollWhere.term = runningTerm
      if (sectionId) enrollWhere.section_id = parseInt(sectionId)

      const enrollments = await db.enroll.findMany({
        where: enrollWhere,
        include: {
          student: {
            select: {
              student_id: true,
              student_code: true,
              name: true,
              first_name: true,
              last_name: true,
              sex: true,
              active_status: true,
              photo: true,
            },
          },
          section: { select: { section_id: true, name: true } },
        },
        orderBy: [{ roll: 'asc' }],
      })

      // Get existing attendance for this class/date
      const timestamp = new Date(date + 'T00:00:00.000Z')
      const nextDay = new Date(date + 'T23:59:59.999Z')
      const existingAttendance = await db.attendance.findMany({
        where: {
          class_id: parseInt(classId),
          timestamp: { gte: timestamp, lte: nextDay },
        },
      })

      const attendanceMap: Record<number, string> = {}
      for (const record of existingAttendance) {
        attendanceMap[record.student_id] = record.status
      }

      const students = enrollments.map(e => ({
        ...e.student,
        enroll_id: e.enroll_id,
        section_id: e.section_id,
        section_name: e.section?.name || '',
        status: attendanceMap[e.student_id] || '',
      }))

      return NextResponse.json({
        status: 'success',
        students,
      })
    }

    // ---- Default: list attendance records ----
    const where: Record<string, unknown> = {}
    if (classId) where.class_id = parseInt(classId)
    if (sectionId) where.section_id = parseInt(sectionId)
    if (date) {
      where.timestamp = {
        gte: new Date(date + 'T00:00:00.000Z'),
        lte: new Date(date + 'T23:59:59.999Z'),
      }
    }

    const records = await db.attendance.findMany({
      where,
      include: {
        student: {
          select: { student_id: true, student_code: true, name: true, first_name: true, last_name: true },
        },
      },
      orderBy: { timestamp: 'desc' },
    })

    return NextResponse.json({ records })
  } catch (error) {
    console.error('[Admin Attendance API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
  }
}

/**
 * POST /api/admin/attendance
 * Save attendance records. Mirrors CI3 Attendance::save()
 *
 * Status values (matching CI3):
 *  1 = Present
 *  2 = Absent
 *  3 = Late
 *  4 = Sick-Home
 *  5 = Sick-Clinic
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { class_id, section_id, date, records } = body

    if (!class_id || !date || !records || !Array.isArray(records)) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required fields: class_id, date, records' },
        { status: 400 }
      )
    }

    if (records.length === 0) {
      return NextResponse.json(
        { status: 'error', message: 'No students selected' },
        { status: 400 }
      )
    }

    // Get running year/term
    const settings = await db.settings.findMany({
      where: { type: { in: ['running_year', 'running_term'] } },
    })
    const year = settings.find(s => s.type === 'running_year')?.description || new Date().getFullYear().toString()
    const term = settings.find(s => s.type === 'running_term')?.description || ''

    const timestamp = new Date(date + 'T00:00:00.000Z')
    const nextDay = new Date(date + 'T23:59:59.999Z')

    let count = 0
    for (const record of records) {
      if (!record.student_id || !record.status) continue

      const existing = await db.attendance.findFirst({
        where: {
          student_id: record.student_id,
          class_id,
          timestamp: { gte: timestamp, lte: nextDay },
        },
      })

      if (existing) {
        await db.attendance.update({
          where: { attendance_id: existing.attendance_id },
          data: { status: String(record.status) },
        })
      } else {
        await db.attendance.create({
          data: {
            student_id: record.student_id,
            class_id,
            section_id: section_id || null,
            timestamp,
            year,
            term,
            status: String(record.status),
            date,
          },
        })
      }
      count++
    }

    return NextResponse.json({
      status: 'success',
      message: `Attendance saved for ${count} students`,
      count,
    })
  } catch (error) {
    console.error('[Admin Attendance API] Save error:', error)
    return NextResponse.json(
      { status: 'error', message: 'Failed to save attendance' },
      { status: 500 }
    )
  }
}
