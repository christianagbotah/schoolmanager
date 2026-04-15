import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

// GET /api/study-material — list study materials with search & filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const class_id = searchParams.get('class_id')
    const subject_id = searchParams.get('subject_id')
    const teacher_id = searchParams.get('teacher_id')

    const where: Record<string, unknown> = {}
    if (search) {
      where.title = { contains: search }
    }
    if (class_id) {
      where.class_id = parseInt(class_id)
    }
    if (subject_id) {
      where.subject_id = parseInt(subject_id)
    }
    if (teacher_id) {
      where.teacher_id = parseInt(teacher_id)
    }

    const materials = await db.study_material.findMany({
      where,
      include: {
        class: { select: { class_id: true, name: true } },
        subject: { select: { subject_id: true, name: true } },
        teacher: { select: { teacher_id: true, name: true } },
      },
      orderBy: { created_at: 'desc' },
    })

    return NextResponse.json(materials)
  } catch (error) {
    console.error('Error fetching study materials:', error)
    return NextResponse.json({ error: 'Failed to fetch study materials' }, { status: 500 })
  }
}

// POST /api/study-material — create a new study material with file upload
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const title = formData.get('title') as string
    const description = (formData.get('description') as string) || ''
    const class_id = formData.get('class_id') as string | null
    const subject_id = formData.get('subject_id') as string | null
    const teacher_id = formData.get('teacher_id') as string | null
    const file = formData.get('file') as File | null

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    // Save file to public/uploads/materials
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'materials')
    await mkdir(uploadDir, { recursive: true })
    const fileName = `${Date.now()}-${file.name}`
    const bytes = await file.arrayBuffer()
    await writeFile(join(uploadDir, fileName), Buffer.from(bytes))

    const fileUrl = `/uploads/materials/${fileName}`

    const material = await db.study_material.create({
      data: {
        title: title.trim(),
        description: description?.trim() || '',
        file_name: file.name,
        file_type: file.type || '',
        file_url: fileUrl,
        class_id: class_id ? parseInt(class_id) : null,
        subject_id: subject_id ? parseInt(subject_id) : null,
        teacher_id: teacher_id ? parseInt(teacher_id) : null,
      },
      include: {
        class: { select: { class_id: true, name: true } },
        subject: { select: { subject_id: true, name: true } },
        teacher: { select: { teacher_id: true, name: true } },
      },
    })

    return NextResponse.json(material, { status: 201 })
  } catch (error) {
    console.error('Error uploading study material:', error)
    return NextResponse.json({ error: 'Failed to upload study material' }, { status: 500 })
  }
}

// DELETE /api/study-material?id=<id> — delete a study material
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')

    if (!id) {
      return NextResponse.json({ error: 'Valid id is required' }, { status: 400 })
    }

    await db.study_material.delete({
      where: { study_material_id: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting study material:', error)
    return NextResponse.json({ error: 'Failed to delete study material' }, { status: 500 })
  }
}
