import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const galleries = await db.frontend_gallery.findMany({
    include: { images: true },
    orderBy: { date: 'desc' },
    take: 200,
  })
  return NextResponse.json(galleries)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { title, description, date } = body

  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  const gallery = await db.frontend_gallery.create({
    data: {
      title,
      description: description || '',
      date: date ? new Date(date) : new Date(),
      timestamp: new Date(),
    },
  })

  return NextResponse.json(gallery, { status: 201 })
}

export async function PUT(req: Request) {
  const body = await req.json()
  const { frontend_gallery_id, ...data } = body

  if (!frontend_gallery_id) return NextResponse.json({ error: 'Gallery ID required' }, { status: 400 })

  const gallery = await db.frontend_gallery.update({
    where: { frontend_gallery_id: parseInt(frontend_gallery_id) },
    data: {
      title: data.title,
      description: data.description || '',
      date: data.date ? new Date(data.date) : undefined,
    },
  })

  return NextResponse.json(gallery)
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await db.frontend_gallery_image.deleteMany({ where: { gallery_id: parseInt(id) } })
  await db.frontend_gallery.delete({ where: { frontend_gallery_id: parseInt(id) } })
  return NextResponse.json({ success: true })
}
