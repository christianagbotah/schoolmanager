import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/frontend/news - List news articles
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

  const news = await db.frontend_news.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    orderBy: { date: 'desc' },
  })

  const total = await db.frontend_news.count()
  const thisMonth = await db.frontend_news.count({
    where: {
      date: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
  })

  return NextResponse.json({ news, stats: { total, thisMonth } })
}

// POST /api/admin/frontend/news - Create news article
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, description, image, date } = body

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const newArticle = await db.frontend_news.create({
    data: {
      title: title || '',
      description: description || '',
      image: image || '',
      date: date ? new Date(date) : new Date(),
      timestamp: new Date(),
    },
  })

  return NextResponse.json(newArticle, { status: 201 })
}

// PUT /api/admin/frontend/news - Update news article
export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body

  if (!id) {
    return NextResponse.json({ error: 'News ID is required' }, { status: 400 })
  }

  const existing = await db.frontend_news.findUnique({ where: { frontend_news_id: parseInt(id) } })
  if (!existing) {
    return NextResponse.json({ error: 'News article not found' }, { status: 404 })
  }

  const updateData: Record<string, unknown> = { timestamp: new Date() }
  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description
  if (data.image !== undefined) updateData.image = data.image
  if (data.date !== undefined) updateData.date = data.date ? new Date(data.date) : null

  const updated = await db.frontend_news.update({
    where: { frontend_news_id: parseInt(id) },
    data: updateData,
  })

  return NextResponse.json(updated)
}

// DELETE /api/admin/frontend/news - Delete news article
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await db.frontend_news.delete({ where: { frontend_news_id: parseInt(id) } })
  return NextResponse.json({ success: true })
}
