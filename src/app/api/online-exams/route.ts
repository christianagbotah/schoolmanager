import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/online-exams - Shared endpoint for all roles
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'exams'
    const examId = searchParams.get('exam_id')
    const status = searchParams.get('status') || ''
    const classId = searchParams.get('class_id') || ''

    if (type === 'questions' && examId) {
      // Get questions for an exam
      const exam = await db.onlineExam.findUnique({
        where: { online_exam_id: parseInt(examId) },
        include: {
          subject: { select: { name: true } },
          class: { select: { name: true } },
        },
      })
      return NextResponse.json({ exam })
    }

    if (type === 'results') {
      const results = await db.online_exam_result.findMany({
        where: examId ? { exam_id: parseInt(examId) } : {},
        include: {
          exam: { select: { title: true, subject: { select: { name: true } } } },
          student: { select: { name: true, student_code: true } },
        },
        orderBy: { online_exam_result_id: 'desc' },
        take: 200,
      })

      const mapped = results.map((r) => ({
        id: r.online_exam_result_id,
        exam_id: r.exam_id,
        exam: r.exam ? { title: r.exam.title } : null,
        student: r.student,
        score: r.obtained_mark,
        total: r.total_mark,
        status: r.status,
        submitted_at: r.online_exam_result_id, // proxy for ordering
      }))

      return NextResponse.json(mapped)
    }

    // Default: list exams
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (classId) where.class_id = parseInt(classId)

    const exams = await db.onlineExam.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        subject: { select: { name: true } },
        class: { select: { name: true, category: true } },
      },
      orderBy: { online_exam_id: 'desc' },
      take: 100,
    })

    // Count questions stored in settings for each exam
    const examIds = exams.map((e) => e.online_exam_id)
    const questionSettings = examIds.length > 0
      ? await db.settings.findMany({
          where: {
            type: 'online_exam_questions',
            description: { in: examIds.map((id) => `questions_for_exam_${id}`) },
          },
        })
      : []
    const questionCounts: Record<number, number> = {}
    for (const qs of questionSettings) {
      try {
        const parsed = JSON.parse(qs.value)
        const eid = parseInt(qs.description.replace('questions_for_exam_', ''))
        questionCounts[eid] = Array.isArray(parsed) ? parsed.length : 0
      } catch {
        /* ignore parse errors */
      }
    }

    const mapped = exams.map((e) => ({
      id: e.online_exam_id,
      title: e.title,
      subject: e.subject ? { subject_id: 0, name: e.subject.name } : null,
      class: e.class ? { class_id: 0, name: e.class.name } : null,
      class_id: e.class_id,
      subject_id: e.subject_id,
      duration: e.duration,
      status: e.status,
      instructions: e.instructions,
      minimum_percentage: e.minimum_percentage,
      start_date: e.start_date,
      end_date: e.end_date,
      total_questions: questionCounts[e.online_exam_id] || 0,
      created_at: e.start_date || new Date(),
    }))

    return NextResponse.json(mapped)
  } catch (error) {
    console.error('Online exams GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch online exams' }, { status: 500 })
  }
}

// POST /api/online-exams
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Submit exam
    if (body.type === 'submit') {
      const { exam_id, student_id, answers } = body
      if (!exam_id || !student_id) {
        return NextResponse.json({ error: 'exam_id and student_id required' }, { status: 400 })
      }

      const exam = await db.onlineExam.findUnique({
        where: { online_exam_id: parseInt(exam_id) },
      })
      if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })

      // Fetch questions from settings to grade the submission
      const questionSetting = await db.settings.findFirst({
        where: {
          type: 'online_exam_questions',
          description: `questions_for_exam_${exam_id}`,
        },
      })

      let obtainedMark = 0
      let totalMark = 0

      if (questionSetting) {
        try {
          const questions: Array<{
            id: number
            type: string
            correct_answer: string
            marks: number
          }> = JSON.parse(questionSetting.value)

          totalMark = questions.reduce((sum, q) => sum + (q.marks || 0), 0)

          for (const q of questions) {
            const studentAnswer = answers?.[String(q.id)] ?? answers?.[q.id]
            if (studentAnswer && q.correct_answer) {
              const normalizedStudent = String(studentAnswer).trim().toLowerCase()
              const normalizedCorrect = String(q.correct_answer).trim().toLowerCase()
              if (normalizedStudent === normalizedCorrect) {
                obtainedMark += q.marks || 1
              }
            }
          }
        } catch {
          // If parsing fails, obtainedMark stays 0
        }
      }

      const result = await db.online_exam_result.create({
        data: {
          exam_id: parseInt(exam_id),
          student_id: parseInt(student_id),
          obtained_mark: obtainedMark,
          total_mark: totalMark,
          status: 'submitted',
        },
      })

      return NextResponse.json({ result, message: 'Exam submitted' }, { status: 201 })
    }

    // Create exam
    const { title, subject_id, class_id, duration, instructions, minimum_percentage, start_date, end_date, status } = body

    if (!title) {
      return NextResponse.json({ error: 'Exam title is required' }, { status: 400 })
    }

    const exam = await db.onlineExam.create({
      data: {
        title,
        subject_id: subject_id ? parseInt(subject_id) : null,
        class_id: class_id ? parseInt(class_id) : null,
        duration: duration ? parseInt(duration) : 30,
        instructions: instructions || '',
        minimum_percentage: minimum_percentage ? parseFloat(minimum_percentage) : 0,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        status: status || 'published',
      },
    })

    return NextResponse.json({ ...exam, id: exam.online_exam_id }, { status: 201 })
  } catch (error) {
    console.error('Online exams POST error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

// PUT /api/online-exams
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, title, subject_id, class_id, duration, status, instructions } = body

    if (!id) {
      return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 })
    }

    const exam = await db.onlineExam.update({
      where: { online_exam_id: parseInt(id) },
      data: {
        title: title || undefined,
        subject_id: subject_id ? parseInt(subject_id) : undefined,
        class_id: class_id ? parseInt(class_id) : undefined,
        duration: duration ? parseInt(duration) : undefined,
        status: status || undefined,
        instructions: instructions || undefined,
      },
    })

    return NextResponse.json({ ...exam, id: exam.online_exam_id })
  } catch (error) {
    console.error('Online exams PUT error:', error)
    return NextResponse.json({ error: 'Failed to update exam' }, { status: 500 })
  }
}

// DELETE /api/online-exams
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await db.online_exam_result.deleteMany({ where: { exam_id: parseInt(id) } })
    await db.onlineExam.delete({ where: { online_exam_id: parseInt(id) } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Online exams DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete exam' }, { status: 500 })
  }
}
