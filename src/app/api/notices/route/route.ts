import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { notice: { contains: search } },
    ]
  }

  const notices = await db.notice.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    orderBy: { timestamp: 'desc' },
    take: 200,
  })

  return NextResponse.json(notices)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, notice, timestamp } = body

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const newNotice = await db.notice.create({
    data: {
      title,
      notice: notice || '',
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    },
  })

  return NextResponse.json(newNotice, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body

  if (!id) {
    return NextResponse.json({ error: 'Notice ID is required' }, { status: 400 })
  }

  const updated = await db.notice.update({
    where: { id: parseInt(id) },
    data: {
      title: data.title,
      notice: data.notice || '',
      timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await db.notice.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ success: true })
}
