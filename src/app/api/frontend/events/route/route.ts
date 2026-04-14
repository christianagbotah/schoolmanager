import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const events = await db.frontend_events.findMany({
    orderBy: { date: 'desc' },
    take: 200,
  })
  return NextResponse.json(events)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { title, description, date } = body

  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  const event = await db.frontend_events.create({
    data: {
      title,
      description: description || '',
      date: date ? new Date(date) : new Date(),
      timestamp: new Date(),
    },
  })

  return NextResponse.json(event, { status: 201 })
}

export async function PUT(req: Request) {
  const body = await req.json()
  const { frontend_events_id, ...data } = body

  if (!frontend_events_id) return NextResponse.json({ error: 'Event ID required' }, { status: 400 })

  const event = await db.frontend_events.update({
    where: { frontend_events_id: parseInt(frontend_events_id) },
    data: {
      title: data.title,
      description: data.description || '',
      date: data.date ? new Date(data.date) : undefined,
      timestamp: new Date(),
    },
  })

  return NextResponse.json(event)
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await db.frontend_events.delete({ where: { frontend_events_id: parseInt(id) } })
  return NextResponse.json({ success: true })
}
