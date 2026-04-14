import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const class_id = searchParams.get('class_id')
  const status = searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { author: { contains: search } },
    ]
  }
  if (class_id) where.class_id = parseInt(class_id)
  if (status) where.status = status

  const books = await db.book.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    include: { book_requests: true },
    orderBy: { book_id: 'desc' },
    take: 200,
  })

  return NextResponse.json(books)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, description, author, class_id, price, total_copies, status } = body

  if (!name) {
    return NextResponse.json({ error: 'Book name is required' }, { status: 400 })
  }

  const book = await db.book.create({
    data: {
      name,
      description: description || '',
      author: author || '',
      class_id: class_id ? parseInt(class_id) : null,
      price: price ? parseFloat(price) : 0,
      total_copies: total_copies ? parseInt(total_copies) : 0,
      issued_copies: 0,
      status: status || 'available',
    },
  })

  return NextResponse.json(book, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { book_id, ...data } = body

  if (!book_id) {
    return NextResponse.json({ error: 'Book ID is required' }, { status: 400 })
  }

  const book = await db.book.update({
    where: { book_id: parseInt(book_id) },
    data: {
      name: data.name,
      description: data.description || '',
      author: data.author || '',
      class_id: data.class_id ? parseInt(data.class_id) : null,
      price: data.price ? parseFloat(data.price) : 0,
      total_copies: data.total_copies ? parseInt(data.total_copies) : 0,
      status: data.status || 'available',
    },
  })

  return NextResponse.json(book)
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 })
  }

  await db.book_request.deleteMany({ where: { book_id: parseInt(id) } })
  await db.book.delete({ where: { book_id: parseInt(id) } })

  return NextResponse.json({ success: true })
}
