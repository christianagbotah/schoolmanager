import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/exams/tabulation - Fetch tabulation sheet data
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const classId = searchParams.get('class_id')
    const examId = searchParams.get('exam_id')

    if (!classId || !examId) {
      return NextResponse.json({ error: 'class_id and exam_id are required' }, { status: 400 })
    }

    // Get class info
    const classData = await db.school_class.findUnique({
      where: { class_id: parseInt(classId) },
      select: { class_id: true, name: true, name_numeric: true, category: true },
    })

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Get exam info
    const examData = await db.exam.findUnique({
      where: { exam_id: parseInt(examId) },
    })

    if (!examData) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    // Get subjects for this class
    const subjects = await db.subject.findMany({
      where: { class_id: parseInt(classId) },
      orderBy: { name: 'asc' },
    })

    // Get enrolled students for this class
    const enrolls = await db.enroll.findMany({
      where: { class_id: parseInt(classId), year: examData.year, mute: 0 },
      include: {
        student: { select: { student_id: true, name: true, student_code: true } },
      },
      orderBy: { roll: 'asc' },
    })

    // Get grades for grading
    const grades = await db.grade.findMany({
      orderBy: { grade_from: 'desc' },
    })

    // Get marks for this class + exam combination
    const marks = await db.mark.findMany({
      where: {
        class_id: parseInt(classId),
        exam_id: parseInt(examId),
      },
    })

    // Build the tabulation matrix
    const students = enrolls.map(e => ({
      student_id: e.student.student_id,
      name: e.student.name,
      student_code: e.student.student_code,
    }))

    // For each student, get marks per subject
    const studentMarks: Record<number, Record<number, number>> = {}
    for (const student of students) {
      studentMarks[student.student_id] = {}
      for (const subject of subjects) {
        const mark = marks.find(
          m => m.student_id === student.student_id && m.subject_id === subject.subject_id
        )
        studentMarks[student.student_id][subject.subject_id] = mark
          ? Math.round(mark.mark_obtained * 100) / 100
          : 0
      }
    }

    // Calculate totals and positions
    const studentTotals = students.map(student => {
      const total = Object.values(studentMarks[student.student_id]).reduce((a, b) => a + b, 0)
      return { student_id: student.student_id, total: Math.round(total * 100) / 100 }
    })

    // Sort by total descending for position calculation
    const ranked = [...studentTotals].sort((a, b) => b.total - a.total)
    const positionMap: Record<number, number> = {}
    let currentPos = 1
    for (let i = 0; i < ranked.length; i++) {
      if (i > 0 && ranked[i].total < ranked[i - 1].total) {
        currentPos = i + 1
      }
      positionMap[ranked[i].student_id] = currentPos
    }

    // Calculate subject averages
    const subjectAvgs: Record<number, number> = {}
    for (const subject of subjects) {
      const marksForSubject = Object.values(studentMarks).map(
        sm => sm[subject.subject_id] || 0
      ).filter(m => m > 0)
      subjectAvgs[subject.subject_id] = marksForSubject.length > 0
        ? Math.round((marksForSubject.reduce((a, b) => a + b, 0) / marksForSubject.length) * 100) / 100
        : 0
    }

    return NextResponse.json({
      class: classData,
      exam: examData,
      subjects,
      students,
      studentMarks,
      studentTotals,
      positionMap,
      subjectAvgs,
      grades,
    })
  } catch (error) {
    console.error('Tabulation GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch tabulation data' }, { status: 500 })
  }
}
