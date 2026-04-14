import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const class_id = searchParams.get('class_id')

    const where: Record<string, unknown> = {}
    if (search) where.title = { contains: search }
    if (class_id) where.class_id = parseInt(class_id)

    // Note: study_materials isn't in schema, return empty for now
    return NextResponse.json([])
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const class_id = formData.get('class_id') as string
    const subject_id = formData.get('subject_id') as string
    const file = formData.get('file') as File

    if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

    // Save file if present
    let fileName = ''
    if (file) {
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'materials')
      await mkdir(uploadDir, { recursive: true })
      fileName = `${Date.now()}-${file.name}`
      const bytes = await file.arrayBuffer()
      await writeFile(join(uploadDir, fileName), Buffer.from(bytes))
    }

    return NextResponse.json({ id: Date.now(), title, description, file_name: fileName, file_type: file?.type || '', downloads: 0, created_at: new Date().toISOString() })
  } catch (error) {
    console.error('Error uploading material:', error)
    return NextResponse.json({ error: 'Failed to upload' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
