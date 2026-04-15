import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/exams/marks - Get marks for a specific exam/class/subject
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const examId = searchParams.get('exam_id')
    const classId = searchParams.get('class_id')
    const sectionId = searchParams.get('section_id')
    const subjectId = searchParams.get('subject_id')

    if (!examId || !classId || !subjectId) {
      return NextResponse.json({ error: 'exam_id, class_id, and subject_id are required' }, { status: 400 })
    }

    const where: Record<string, unknown> = {
      exam_id: parseInt(examId),
      class_id: parseInt(classId),
      subject_id: parseInt(subjectId),
    }
    if (sectionId) where.section_id = parseInt(sectionId)

    // Get enrolled students for this class
    const enrollments = await db.enroll.findMany({
      where: {
        class_id: parseInt(classId),
        section_id: sectionId ? parseInt(sectionId) : undefined,
        mute: 0,
      },
      include: {
        student: {
          select: {
            student_id: true,
            name: true,
            student_code: true,
            parent: {
              select: {
                parent_id: true,
                name: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { roll: 'asc' },
    })

    // Get existing marks for these students
    const existingMarks = await db.mark.findMany({
      where,
      include: {
        student: { select: { student_id: true, name: true, student_code: true } },
      },
    })

    // Build a map of student_id -> mark
    const marksMap = new Map<number, typeof existingMarks[0]>()
    for (const m of existingMarks) {
      marksMap.set(m.student_id, m)
    }

    // Merge students with their marks
    const studentsWithMarks = enrollments.map(e => {
      const existing = marksMap.get(e.student_id)
      return {
        student_id: e.student.student_id,
        name: e.student.name,
        student_code: e.student.student_code,
        mark_id: existing?.mark_id || null,
        mark_obtained: existing?.mark_obtained || 0,
        comment: existing?.comment || '',
        parent: e.student.parent || null,
      }
    })

    // Get exam and subject info
    const [examInfo, subjectInfo] = await Promise.all([
      db.exam.findUnique({ where: { exam_id: parseInt(examId) }, select: { name: true, year: true } }),
      db.subject.findUnique({ where: { subject_id: parseInt(subjectId) }, select: { name: true } }),
    ])

    return NextResponse.json({
      students: studentsWithMarks,
      exam: examInfo,
      subject: subjectInfo,
    })
  } catch (error) {
    console.error('Exam marks GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch marks' }, { status: 500 })
  }
}

// POST /api/admin/exams/marks - Save marks (batch upsert)
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

      const existing = await db.mark.findFirst({
        where: {
          student_id: record.student_id,
          subject_id: record.subject_id,
          exam_id: record.exam_id || null,
          class_id: record.class_id || null,
          section_id: record.section_id || null,
        },
      })

      if (existing) {
        await db.mark.update({
          where: { mark_id: existing.mark_id },
          data: {
            mark_obtained: record.mark_obtained ?? 0,
            comment: record.comment ?? '',
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
    console.error('Exam marks POST error:', error)
    return NextResponse.json({ error: 'Failed to save marks' }, { status: 500 })
  }
}
