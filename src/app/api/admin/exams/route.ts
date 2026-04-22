import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/exams - List all exams with filtering, pagination, categories, and summary stats
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const classId = searchParams.get('class_id') || ''
    const sectionId = searchParams.get('section_id') || ''
    const type = searchParams.get('type') || ''
    const year = searchParams.get('year') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    if (classId) where.class_id = parseInt(classId)
    if (sectionId) where.section_id = parseInt(sectionId)
    if (type) where.type = type
    if (year) where.year = year
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { comment: { contains: search } },
        { year: { contains: search } },
      ]
    }

    const skip = (page - 1) * limit

    const [exams, total, subjectsResult, avgResult, examIdsResult, categories] = await Promise.all([
      db.exam.findMany({
        where,
        include: {
          class: {
            select: { class_id: true, name: true, category: true, name_numeric: true },
          },
          category: {
            select: { exam_category_id: true, name: true },
          },
          _count: {
            select: { marks_list: true, exam_marks: true },
          },
        },
        orderBy: [{ date: 'desc' }, { exam_id: 'desc' }],
        skip,
        take: limit,
      }),
      db.exam.count({ where }),
      db.mark.groupBy({
        by: ['subject_id'],
        where: { exam_id: { not: null } },
        _count: true,
      }),
      db.mark.aggregate({
        _avg: { mark_obtained: true },
        where: { exam_id: { not: null } },
      }),
      db.exam.findMany({ where, select: { exam_id: true } }),
      db.examCategory.findMany({
        where: { is_active: 1 },
        orderBy: { name: 'asc' },
      }),
    ])

    // Get distinct subjects per exam
    const examIdList = examIdsResult.map((e) => e.exam_id)
    let subjectsPerExam: Record<number, number> = {}

    if (examIdList.length > 0) {
      const perExamSubjects = await db.mark.groupBy({
        by: ['exam_id', 'subject_id'],
        where: { exam_id: { in: examIdList } },
      })
      for (const entry of perExamSubjects) {
        if (entry.exam_id) {
          subjectsPerExam[entry.exam_id] = (subjectsPerExam[entry.exam_id] || 0) + 1
        }
      }
    }

    const examsWithSubjects = exams.map((exam) => ({
      ...exam,
      subjectsCount: subjectsPerExam[exam.exam_id] || 0,
    }))

    const summary = {
      totalSubjects: subjectsResult.length,
      avgScore: avgResult._avg.mark_obtained
        ? Math.round(avgResult._avg.mark_obtained * 10) / 10
        : 0,
    }

    return NextResponse.json({
      exams: examsWithSubjects,
      categories,
      summary,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Admin Exams GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 })
  }
}

// POST /api/admin/exams - Create a new exam
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, date, comment, year, class_id, section_id, type, category_id, term, sem } = body

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
        category_id: category_id || null,
        term: term || 0,
        sem: sem || 0,
      },
      include: {
        class: { select: { class_id: true, name: true, category: true, name_numeric: true } },
        category: { select: { exam_category_id: true, name: true } },
      },
    })

    return NextResponse.json(exam, { status: 201 })
  } catch (error) {
    console.error('Admin Exams POST error:', error)
    return NextResponse.json({ error: 'Failed to create exam' }, { status: 500 })
  }
}
