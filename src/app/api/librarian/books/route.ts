import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/librarian/books — List books with stats, search, category chart data
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const class_id = searchParams.get('class_id')
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { author: { contains: search } },
      { isbn: { contains: search } },
    ]
  }
  if (category) where.category = category
  if (class_id) where.class_id = parseInt(class_id)
  if (status) where.status = status

  const [books, totalCount, aggregates, categoryGroups] = await Promise.all([
    db.book.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        school_class: { select: { class_id: true, name: true } },
      },
      orderBy: { book_id: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.book.count({ where: Object.keys(where).length > 0 ? where : undefined }),
    db.book.aggregate({
      _sum: { total_copies: true, issued_copies: true, price: true },
      _count: true,
    }),
    db.book.groupBy({
      by: ['category'],
      _count: { book_id: true },
      _sum: { total_copies: true, issued_copies: true },
    }),
  ])

  const requestStats = await db.book_request.groupBy({
    by: ['status'],
    _count: { book_request_id: true },
  })

  // Weekly issuance trend (last 8 weeks)
  const now = new Date()
  const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000)
  const recentRequests = await db.book_request.findMany({
    where: {
      status: { in: ['issued', 'returned'] },
      issue_start_date: { gte: eightWeeksAgo },
    },
    select: {
      issue_start_date: true,
      status: true,
    },
    orderBy: { issue_start_date: 'asc' },
  })

  // Group by week
  const weekMap: Record<string, { issued: number; returned: number }> = {}
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
    const key = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    weekMap[key] = { issued: 0, returned: 0 }
  }
  for (const r of recentRequests) {
    if (!r.issue_start_date) continue
    const rDate = new Date(r.issue_start_date)
    const weeksAgo = Math.floor((now.getTime() - rDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
    const keys = Object.keys(weekMap)
    const idx = keys.length - 1 - weeksAgo
    if (idx >= 0 && idx < keys.length) {
      if (r.status === 'issued') weekMap[keys[idx]].issued++
      if (r.status === 'returned') weekMap[keys[idx]].returned++
    }
  }
  const weeklyTrend = Object.entries(weekMap).map(([week, counts]) => ({
    week,
    issued: counts.issued,
    returned: counts.returned,
  }))

  // Most popular books (by issued count)
  const popularBooks = await db.book.findMany({
    where: { issued_copies: { gt: 0 } },
    orderBy: { issued_copies: 'desc' },
    take: 5,
    select: { book_id: true, name: true, author: true, total_copies: true, issued_copies: true },
  })

  // Unique categories count
  const uniqueCategories = new Set(books.map((b: any) => b.category).filter(Boolean)).size

  const totalCopies = aggregates._sum.total_copies || 0
  const issuedCopies = aggregates._sum.issued_copies || 0

  return NextResponse.json({
    data: books,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
    stats: {
      total_books: aggregates._count,
      total_copies: totalCopies,
      issued_copies: issuedCopies,
      available_copies: totalCopies - issuedCopies,
      total_value: aggregates._sum.price || 0,
      unique_categories: uniqueCategories,
      pending_requests: requestStats.find((r) => r.status === 'pending')?._count.book_request_id || 0,
      issued_requests: requestStats.find((r) => r.status === 'issued')?._count.book_request_id || 0,
      returned_requests: requestStats.find((r) => r.status === 'returned')?._count.book_request_id || 0,
      categories: categoryGroups
        .filter((g) => g.category)
        .map((g) => ({
          category: g.category,
          count: g._count.book_id,
          totalCopies: g._sum.total_copies || 0,
          issuedCopies: g._sum.issued_copies || 0,
        }))
        .sort((a, b) => b.count - a.count),
    },
    charts: {
      weeklyTrend,
      popularBooks,
    },
  })
}

// POST /api/librarian/books — Create a new book
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, description, author, isbn, category, shelf, class_id, price, total_copies, status } = body

  if (!name) {
    return NextResponse.json({ error: 'Book title is required' }, { status: 400 })
  }

  const book = await db.book.create({
    data: {
      name,
      description: description || '',
      author: author || '',
      isbn: isbn || '',
      category: category || '',
      shelf: shelf || '',
      class_id: class_id ? parseInt(class_id) : null,
      price: price ? parseFloat(price) : 0,
      total_copies: total_copies ? parseInt(total_copies) : 0,
      issued_copies: 0,
      status: status || 'available',
    },
  })

  return NextResponse.json(book, { status: 201 })
}

// PUT /api/librarian/books — Update a book
export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { book_id, ...data } = body

  if (!book_id) {
    return NextResponse.json({ error: 'Book ID is required' }, { status: 400 })
  }

  const existing = await db.book.findUnique({ where: { book_id: parseInt(book_id) } })
  if (!existing) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }

  // Prevent setting total_copies lower than issued_copies
  const newTotal = data.total_copies ? parseInt(data.total_copies) : existing.total_copies
  if (newTotal < existing.issued_copies) {
    return NextResponse.json({ error: `Cannot set total copies to ${newTotal} when ${existing.issued_copies} are issued` }, { status: 400 })
  }

  const book = await db.book.update({
    where: { book_id: parseInt(book_id) },
    data: {
      name: data.name ?? existing.name,
      description: data.description ?? existing.description,
      author: data.author ?? existing.author,
      isbn: data.isbn ?? existing.isbn,
      category: data.category ?? existing.category,
      shelf: data.shelf ?? existing.shelf,
      class_id: data.class_id ? parseInt(data.class_id) : (data.class_id === null ? null : existing.class_id),
      price: data.price !== undefined ? parseFloat(data.price) : existing.price,
      total_copies: newTotal,
      status: data.status ?? existing.status,
    },
  })

  return NextResponse.json(book)
}

// DELETE /api/librarian/books — Delete a book
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Book ID is required' }, { status: 400 })
  }

  const book = await db.book.findUnique({ where: { book_id: parseInt(id) } })
  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }

  if (book.issued_copies > 0) {
    return NextResponse.json({ error: `Cannot delete book with ${book.issued_copies} issued copies. Return all copies first.` }, { status: 400 })
  }

  await db.book_request.deleteMany({ where: { book_id: parseInt(id) } })
  await db.book.delete({ where: { book_id: parseInt(id) } })

  return NextResponse.json({ success: true })
}
