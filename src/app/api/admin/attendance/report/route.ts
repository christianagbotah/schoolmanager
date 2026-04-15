import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/admin/attendance/report
 * Attendance report data. Mirrors CI3 Attendance::get_report_data()
 *
 * Query params:
 *  - class_id (optional)
 *  - section_id (optional)
 *  - start_date (required)
 *  - end_date (required)
 *  - status (optional filter by status)
 *  - report_type: 'analytics' | 'monthly_grid'
 *  - month, year, term (for monthly_grid)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('class_id')
    const sectionId = searchParams.get('section_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const status = searchParams.get('status')
    const reportType = searchParams.get('report_type') || 'analytics'

    if (!startDate || !endDate) {
      return NextResponse.json(
        { status: 'error', message: 'start_date and end_date are required' },
        { status: 400 }
      )
    }

    const startTimestamp = new Date(startDate + 'T00:00:00.000Z')
    const endTimestamp = new Date(endDate + 'T23:59:59.999Z')
    const totalDays = Math.ceil((endTimestamp.getTime() - startTimestamp.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // Get settings
    const settings = await db.settings.findMany({
      where: { type: { in: ['running_year', 'running_term'] } },
    })
    const runningYear = settings.find(s => s.type === 'running_year')?.description || ''
    const runningTerm = settings.find(s => s.type === 'running_term')?.description || ''

    // Get all enrolled students
    const enrollWhere: Record<string, unknown> = {}
    if (runningYear) enrollWhere.year = runningYear
    if (runningTerm) enrollWhere.term = runningTerm
    if (classId) enrollWhere.class_id = parseInt(classId)
    if (sectionId) enrollWhere.section_id = parseInt(sectionId)

    const enrollments = await db.enroll.findMany({
      where: enrollWhere,
      include: {
        student: {
          select: { student_id: true, student_code: true, name: true },
        },
        class: { select: { class_id: true, name: true, name_numeric: true } },
        section: { select: { section_id: true, name: true } },
      },
    })

    const totalPresent = 0
    const totalAbsent = 0
    const totalLate = 0
    const totalSickHome = 0
    const totalSickClinic = 0

    const students = []
    let sumPresent = 0
    let sumAbsent = 0
    let sumLate = 0
    let sumSickHome = 0
    let sumSickClinic = 0

    for (const e of enrollments) {
      const s = e.student
      if (!s) continue

      const attendanceWhere: Record<string, unknown> = {
        student_id: s.student_id,
        timestamp: { gte: startTimestamp, lte: endTimestamp },
      }
      if (status) attendanceWhere.status = status

      const counts = await db.attendance.groupBy({
        by: ['status'],
        where: attendanceWhere,
        _count: true,
      })

      let present = 0
      let absent = 0
      let late = 0
      let sickHome = 0
      let sickClinic = 0

      for (const c of counts) {
        switch (c.status) {
          case '1': present = c._count; break
          case '2': absent = c._count; break
          case '3': late = c._count; break
          case '4': sickHome = c._count; break
          case '5': sickClinic = c._count; break
        }
      }

      const percentage = totalDays > 0 ? Math.round((present / totalDays) * 1000) / 10 : 0

      students.push({
        student_id: s.student_id,
        student_code: s.student_code,
        name: s.name,
        class_name: `${e.class.name}${e.class.name_numeric ? ' ' + e.class.name_numeric : ''}`,
        section_name: e.section?.name || '',
        present,
        absent,
        late,
        sick_home: sickHome,
        sick_clinic: sickClinic,
        percentage,
      })

      sumPresent += present
      sumAbsent += absent
      sumLate += late
      sumSickHome += sickHome
      sumSickClinic += sickClinic
    }

    const totalRecords = sumPresent + sumAbsent + sumLate + sumSickHome + sumSickClinic
    const attendanceRate = totalRecords > 0
      ? Math.round(((sumPresent + sumLate) / totalRecords) * 1000) / 10
      : 0
    const absentRate = totalRecords > 0
      ? Math.round(((sumAbsent + sumSickHome + sumSickClinic) / totalRecords) * 1000) / 10
      : 0

    // Trend data: weekly aggregation
    const weeklyTrend: { week: string; rate: number }[] = []
    const weeks = Math.ceil(totalDays / 7)
    for (let w = 0; w < weeks; w++) {
      const weekStart = new Date(startTimestamp)
      weekStart.setDate(weekStart.getDate() + w * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      if (weekEnd > endTimestamp) weekEnd.setTime(endTimestamp.getTime())

      const weekRecords = await db.attendance.findMany({
        where: {
          timestamp: { gte: weekStart, lte: weekEnd },
        },
        select: { status: true },
      })

      const weekPresent = weekRecords.filter(r => r.status === '1' || r.status === '3').length
      const weekTotal = weekRecords.length
      const weekRate = weekTotal > 0 ? Math.round((weekPresent / weekTotal) * 1000) / 10 : 0

      weeklyTrend.push({
        week: `Week ${w + 1}`,
        rate: weekRate,
      })
    }

    return NextResponse.json({
      status: 'success',
      data: {
        stats: {
          total_days: totalDays,
          total_present: sumPresent,
          total_absent: sumAbsent,
          total_late: sumLate,
          total_sick_home: sumSickHome,
          total_sick_clinic: sumSickClinic,
          attendance_rate: attendanceRate,
          absent_rate: absentRate,
        },
        weekly_trend: weeklyTrend,
        students,
      },
    })
  } catch (error) {
    console.error('[Admin Attendance Report API] Error:', error)
    return NextResponse.json(
      { status: 'error', message: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
