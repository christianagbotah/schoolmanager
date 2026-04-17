import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/frontend/events - List events
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

  const events = await db.frontend_events.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    orderBy: { date: 'desc' },
  })

  const total = await db.frontend_events.count()
  const upcoming = await db.frontend_events.count({
    where: { date: { gte: new Date() } },
  })
  const past = await db.frontend_events.count({
    where: { date: { lt: new Date() } },
  })

  return NextResponse.json({ events, stats: { total, upcoming, past } })
}

// POST /api/admin/frontend/events - Create event
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, description, image, date } = body

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const newEvent = await db.frontend_events.create({
    data: {
      title: title || '',
      description: description || '',
      image: image || '',
      date: date ? new Date(date) : new Date(),
      timestamp: new Date(),
    },
  })

  return NextResponse.json(newEvent, { status: 201 })
}

// PUT /api/admin/frontend/events - Update event
export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body

  if (!id) {
    return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
  }

  const existing = await db.frontend_events.findUnique({ where: { frontend_events_id: parseInt(id) } })
  if (!existing) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const updateData: Record<string, unknown> = { timestamp: new Date() }
  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description
  if (data.image !== undefined) updateData.image = data.image
  if (data.date !== undefined) updateData.date = data.date ? new Date(data.date) : null

  const updated = await db.frontend_events.update({
    where: { frontend_events_id: parseInt(id) },
    data: updateData,
  })

  return NextResponse.json(updated)
}

// DELETE /api/admin/frontend/events - Delete event
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await db.frontend_events.delete({ where: { frontend_events_id: parseInt(id) } })
  return NextResponse.json({ success: true })
}
