import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/frontend/gallery - List gallery albums
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ]
  }

  const galleries = await db.frontend_gallery.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    orderBy: { date: 'desc' },
    include: {
      images: {
        orderBy: { date: 'desc' },
      },
    },
  })

  const total = await db.frontend_gallery.count()
  const totalImages = await db.frontend_gallery_image.count()

  return NextResponse.json({ galleries, stats: { total, totalImages } })
}

// POST /api/admin/frontend/gallery - Create album
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, description, date } = body

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const newAlbum = await db.frontend_gallery.create({
    data: {
      title: title || '',
      description: description || '',
      date: date ? new Date(date) : new Date(),
      timestamp: new Date(),
    },
  })

  return NextResponse.json(newAlbum, { status: 201 })
}

// PUT /api/admin/frontend/gallery - Update album
export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body

  if (!id) {
    return NextResponse.json({ error: 'Album ID is required' }, { status: 400 })
  }

  const existing = await db.frontend_gallery.findUnique({ where: { frontend_gallery_id: parseInt(id) } })
  if (!existing) {
    return NextResponse.json({ error: 'Album not found' }, { status: 404 })
  }

  const updateData: Record<string, unknown> = { timestamp: new Date() }
  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description
  if (data.date !== undefined) updateData.date = data.date ? new Date(data.date) : null

  const updated = await db.frontend_gallery.update({
    where: { frontend_gallery_id: parseInt(id) },
    data: updateData,
  })

  return NextResponse.json(updated)
}

// DELETE /api/admin/frontend/gallery - Delete album and its images
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  // Delete images first
  await db.frontend_gallery_image.deleteMany({ where: { gallery_id: parseInt(id) } })
  await db.frontend_gallery.delete({ where: { frontend_gallery_id: parseInt(id) } })
  return NextResponse.json({ success: true })
}

// ============================================================
// Gallery Image sub-resource endpoints
// ============================================================

// POST /api/admin/frontend/gallery?action=add_image - Add image to album
// We handle image operations via the action query param
export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const body = await req.json()

  if (action === 'add_image') {
    const { gallery_id, image_name, caption } = body
    if (!gallery_id || !image_name) {
      return NextResponse.json({ error: 'gallery_id and image_name are required' }, { status: 400 })
    }

    const newImage = await db.frontend_gallery_image.create({
      data: {
        gallery_id: parseInt(gallery_id),
        image_name: image_name,
        caption: caption || '',
        date: new Date(),
      },
    })

    return NextResponse.json(newImage, { status: 201 })
  }

  if (action === 'remove_image') {
    const { image_id } = body
    if (!image_id) {
      return NextResponse.json({ error: 'image_id is required' }, { status: 400 })
    }

    await db.frontend_gallery_image.delete({ where: { frontend_gallery_image_id: parseInt(image_id) } })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
