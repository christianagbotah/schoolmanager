import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/reports/terminal - Generate terminal reports
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const classId = searchParams.get('class_id')
    const term = searchParams.get('term')
    const year = searchParams.get('year')
    const studentId = searchParams.get('student_id')

    if (!classId) {
      return NextResponse.json({ error: 'class_id is required' }, { status: 400 })
    }

    // Get enrolled students for this class
    const enrolls = await db.enroll.findMany({
      where: {
        class_id: parseInt(classId),
        year: year || undefined,
        term: term || undefined,
      },
      include: {
        student: {
          select: { student_id: true, student_code: true, name: true, first_name: true, last_name: true, sex: true },
        },
      },
      orderBy: { roll: 'asc' },
    })

    if (enrolls.length === 0) {
      return NextResponse.json({ students: [], subjects: [], reports: [] })
    }

    // Get subjects for this class
    const subjects = await db.subject.findMany({
      where: { class_id: parseInt(classId) },
      select: { subject_id: true, name: true },
      orderBy: { name: 'asc' },
    })

    // Get exams for this class and term
    const exams = await db.exam.findMany({
      where: {
        class_id: parseInt(classId),
        year: year || undefined,
      },
      select: { exam_id: true, name: true, type: true },
    })

    const examIds = exams.map(e => e.exam_id)

    // Get all marks for these students, subjects, and exams
    const allMarks = examIds.length > 0
      ? await db.mark.findMany({
          where: {
            class_id: parseInt(classId),
            exam_id: { in: examIds },
            student_id: { in: enrolls.map(e => e.student_id) },
          },
        })
      : []

    // Build student report data
    const grades = await db.grade.findMany({ orderBy: [{ grade_from: 'desc' }] })

    const studentReports = enrolls.map((enroll, index) => {
      const student = enroll.student
      const studentMarks: Record<number, number> = {}

      // Get marks for each subject
      subjects.forEach(subject => {
        const subjectMarks = allMarks.filter(
          m => m.student_id === student.student_id && m.subject_id === subject.subject_id
        )
        // Use the highest mark or average across exams
        if (subjectMarks.length > 0) {
          studentMarks[subject.subject_id] = Math.max(...subjectMarks.map(m => m.mark_obtained))
        }
      })

      const marksArray = Object.values(studentMarks)
      const totalScore = marksArray.reduce((a, b) => a + b, 0)
      const average = marksArray.length > 0 ? totalScore / marksArray.length : 0

      const grade = grades.find(g => average >= g.grade_from && average <= g.grade_to)

      return {
        student_id: student.student_id,
        student_code: student.student_code,
        name: student.name,
        first_name: student.first_name,
        last_name: student.last_name,
        sex: student.sex,
        roll: enroll.roll,
        marks: studentMarks,
        total_score: totalScore,
        average: Math.round(average * 10) / 10,
        grade: grade?.name || '',
        grade_comment: grade?.comment || '',
        subjects_count: subjects.length,
        marks_entered: marksArray.filter(m => m > 0).length,
        rank: 0,
      }
    })

    // Calculate positions
    const sorted = [...studentReports].sort((a, b) => b.total_score - a.total_score)
    sorted.forEach((report, index) => {
      report.rank = index + 1
      // Handle ties
      if (index > 0 && report.total_score === sorted[index - 1].total_score) {
        report.rank = sorted[index - 1].rank
      }
    })

    // Subject statistics
    const subjectStats = subjects.map(subject => {
      const subjectMarks = studentReports.map(r => r.marks[subject.subject_id] || 0).filter(m => m > 0)
      return {
        subject_id: subject.subject_id,
        name: subject.name,
        highest: subjectMarks.length > 0 ? Math.max(...subjectMarks) : 0,
        lowest: subjectMarks.length > 0 ? Math.min(...subjectMarks) : 0,
        average: subjectMarks.length > 0 ? Math.round((subjectMarks.reduce((a, b) => a + b, 0) / subjectMarks.length) * 10) / 10 : 0,
      }
    })

    return NextResponse.json({
      students: studentReports,
      subjects,
      subject_stats: subjectStats,
      exams,
      grades,
    })
  } catch (error) {
    console.error('Terminal Reports error:', error)
    return NextResponse.json({ error: 'Failed to generate terminal reports' }, { status: 500 })
  }
}

// POST /api/reports/terminal - Save terminal reports
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reports } = body

    if (!reports || !Array.isArray(reports)) {
      return NextResponse.json({ error: 'reports array is required' }, { status: 400 })
    }

    let count = 0
    for (const report of reports) {
      // Upsert terminal report
      const existing = await db.terminal_reports.findFirst({
        where: {
          student_id: report.student_id,
          class_id: report.class_id,
          term: report.term,
          year: report.year,
        },
      })

      if (existing) {
        await db.terminal_reports.update({
          where: { report_id: existing.report_id },
          data: {
            total_score: report.total_score,
            grade: report.grade,
            rank: report.rank,
            position: report.position || '',
            teacher_comment: report.teacher_comment || '',
            head_comment: report.head_comment || '',
          },
        })
      } else {
        await db.terminal_reports.create({
          data: {
            student_id: report.student_id,
            class_id: report.class_id,
            year: report.year || '',
            term: report.term || '',
            total_score: report.total_score,
            grade: report.grade,
            rank: report.rank,
            position: report.position || '',
            teacher_comment: report.teacher_comment || '',
            head_comment: report.head_comment || '',
          },
        })
      }
      count++
    }

    return NextResponse.json({ success: true, count })
  } catch (error) {
    console.error('Terminal Reports POST error:', error)
    return NextResponse.json({ error: 'Failed to save terminal reports' }, { status: 500 })
  }
}
