import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, unlink } from 'fs/promises'
import path from 'path'

// GET /api/admin/exams/question-papers - List question papers
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const examId = searchParams.get('exam_id')
    const classId = searchParams.get('class_id')

    const where: Record<string, unknown> = {}
    if (examId) where.exam_id = parseInt(examId)
    if (classId) where.class_id = parseInt(classId)

    const papers = await db.question_paper.findMany({
      where,
      orderBy: { question_paper_id: 'desc' },
      include: {
        exam: { select: { exam_id: true, name: true } },
      },
    })

    // Enrich with class and teacher names
    const enrichedPapers = await Promise.all(papers.map(async (paper) => {
      let className = ''
      let teacherName = ''

      if (paper.class_id) {
        const cls = await db.school_class.findUnique({
          where: { class_id: paper.class_id },
          select: { name: true, name_numeric: true },
        })
        className = cls ? `${cls.name} ${cls.name_numeric}` : ''
      }

      if (paper.teacher_id) {
        const teacher = await db.teacher.findUnique({
          where: { teacher_id: paper.teacher_id },
          select: { name: true },
        })
        teacherName = teacher?.name || ''
      }

      return {
        ...paper,
        class_name: className,
        teacher_name: teacherName,
      }
    }))

    return NextResponse.json({ papers: enrichedPapers })
  } catch (error) {
    console.error('Question papers GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch question papers' }, { status: 500 })
  }
}

// POST /api/admin/exams/question-papers - Upload a question paper
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const title = formData.get('title') as string
    const classId = formData.get('class_id') as string
    const examId = formData.get('exam_id') as string
    const teacherId = formData.get('teacher_id') as string
    const description = formData.get('description') as string
    const file = formData.get('file') as File | null

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    let filePath = ''
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Create uploads directory if not exists
      const uploadDir = path.join(process.cwd(), 'uploads', 'question-papers')
      const { mkdir } = await import('fs/promises')
      await mkdir(uploadDir, { recursive: true })

      const fileExt = path.extname(file.name)
      const fileName = `qp_${Date.now()}${fileExt}`
      filePath = path.join(uploadDir, fileName)

      await writeFile(filePath, buffer)
      filePath = `/uploads/question-papers/${fileName}`
    }

    const paper = await db.question_paper.create({
      data: {
        title: title.toUpperCase(),
        class_id: classId ? parseInt(classId) : null,
        exam_id: examId ? parseInt(examId) : null,
        teacher_id: teacherId ? parseInt(teacherId) : null,
        file_path: filePath,
        description: description || '',
        upload_date: new Date(),
        uploaded_by: 'admin',
      },
    })

    return NextResponse.json({ success: true, paper })
  } catch (error) {
    console.error('Question papers POST error:', error)
    return NextResponse.json({ error: 'Failed to upload question paper' }, { status: 500 })
  }
}

// DELETE /api/admin/exams/question-papers - Delete a question paper
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const paperId = searchParams.get('id')
    if (!paperId) {
      return NextResponse.json({ error: 'Paper ID is required' }, { status: 400 })
    }

    const paper = await db.question_paper.findUnique({
      where: { question_paper_id: parseInt(paperId) },
    })

    if (!paper) {
      return NextResponse.json({ error: 'Question paper not found' }, { status: 404 })
    }

    // Delete file from filesystem if it exists
    if (paper.file_path) {
      const fullPath = path.join(process.cwd(), paper.file_path)
      try { await unlink(fullPath) } catch { /* file might not exist */ }
    }

    await db.question_paper.delete({
      where: { question_paper_id: parseInt(paperId) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Question papers DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete question paper' }, { status: 500 })
  }
}
