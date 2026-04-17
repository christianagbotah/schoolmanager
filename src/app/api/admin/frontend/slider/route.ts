import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/frontend/slider - List all slides
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (status && status !== 'all') {
    where.status = parseInt(status)
  }

  const slides = await db.frontend_slider.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    orderBy: { sort_order: 'asc' },
  })

  const total = await db.frontend_slider.count()
  const active = await db.frontend_slider.count({ where: { status: 1 } })
  const inactive = await db.frontend_slider.count({ where: { status: 0 } })

  return NextResponse.json({ slides, stats: { total, active, inactive } })
}

// POST /api/admin/frontend/slider - Create slide
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, subtitle, image, button_text, button_url, sort_order, status } = body

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const newSlide = await db.frontend_slider.create({
    data: {
      title: title || '',
      subtitle: subtitle || '',
      image: image || '',
      button_text: button_text || '',
      button_url: button_url || '',
      sort_order: sort_order || 0,
      status: status !== undefined ? (status ? 1 : 0) : 1,
      timestamp: new Date(),
    },
  })

  return NextResponse.json(newSlide, { status: 201 })
}

// PUT /api/admin/frontend/slider - Update slide
export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body

  if (!id) {
    return NextResponse.json({ error: 'Slide ID is required' }, { status: 400 })
  }

  const existing = await db.frontend_slider.findUnique({ where: { frontend_slider_id: parseInt(id) } })
  if (!existing) {
    return NextResponse.json({ error: 'Slide not found' }, { status: 404 })
  }

  const updateData: Record<string, unknown> = { timestamp: new Date() }
  if (data.title !== undefined) updateData.title = data.title
  if (data.subtitle !== undefined) updateData.subtitle = data.subtitle
  if (data.image !== undefined) updateData.image = data.image
  if (data.button_text !== undefined) updateData.button_text = data.button_text
  if (data.button_url !== undefined) updateData.button_url = data.button_url
  if (data.sort_order !== undefined) updateData.sort_order = data.sort_order
  if (data.status !== undefined) updateData.status = data.status ? 1 : 0

  const updated = await db.frontend_slider.update({
    where: { frontend_slider_id: parseInt(id) },
    data: updateData,
  })

  return NextResponse.json(updated)
}

// DELETE /api/admin/frontend/slider - Delete slide
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await db.frontend_slider.delete({ where: { frontend_slider_id: parseInt(id) } })
  return NextResponse.json({ success: true })
}
