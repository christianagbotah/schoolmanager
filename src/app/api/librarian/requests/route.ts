import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/librarian/requests — List book requests with stats, search, filter
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const where: Record<string, unknown> = {}
  if (status) where.status = status

  if (search) {
    where.OR = [
      { book: { name: { contains: search } } },
      { student: { name: { contains: search } } },
      { student: { student_code: { contains: search } } },
    ]
  }

  const [requests, totalCount, statusGroups] = await Promise.all([
    db.book_request.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        book: { select: { book_id: true, name: true, author: true, isbn: true, category: true, total_copies: true, issued_copies: true } },
        student: { select: { student_id: true, name: true, student_code: true } },
      },
      orderBy: { book_request_id: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.book_request.count({ where: Object.keys(where).length > 0 ? where : undefined }),
    db.book_request.groupBy({
      by: ['status'],
      _count: { book_request_id: true },
    }),
  ])

  // Calculate overdue count from DB level
  const overdueCount = await db.book_request.count({
    where: {
      status: 'issued',
      issue_end_date: { lt: new Date() },
    },
  })

  // Overdue requests detail
  const overdueRequests = await db.book_request.findMany({
    where: {
      status: 'issued',
      issue_end_date: { lt: new Date() },
    },
    include: {
      book: { select: { book_id: true, name: true, author: true } },
      student: { select: { student_id: true, name: true, student_code: true } },
    },
    take: 10,
    orderBy: { issue_end_date: 'asc' },
  })

  return NextResponse.json({
    data: requests,
    pagination: { page, limit, total: totalCount, totalPages: Math.ceil(totalCount / limit) },
    stats: {
      total: totalCount,
      pending: statusGroups.find((r) => r.status === 'pending')?._count.book_request_id || 0,
      issued: statusGroups.find((r) => r.status === 'issued')?._count.book_request_id || 0,
      returned: statusGroups.find((r) => r.status === 'returned')?._count.book_request_id || 0,
      rejected: statusGroups.find((r) => r.status === 'rejected')?._count.book_request_id || 0,
      overdue: overdueCount,
    },
    overdueRequests,
  })
}

// POST /api/librarian/requests — Create a new book request or directly issue
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { book_id, student_id, issue_start_date, issue_end_date, status } = body

  if (!book_id || !student_id) {
    return NextResponse.json({ error: 'book_id and student_id are required' }, { status: 400 })
  }

  const book = await db.book.findUnique({ where: { book_id: parseInt(book_id) } })
  if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 })

  // If issuing directly, check available copies
  if (status === 'issued') {
    const available = book.total_copies - book.issued_copies
    if (available <= 0) {
      return NextResponse.json({ error: 'No copies available' }, { status: 400 })
    }
  }

  // Check for duplicate active request
  const existing = await db.book_request.findFirst({
    where: {
      book_id: parseInt(book_id),
      student_id: parseInt(student_id),
      status: { in: ['pending', 'issued'] },
    },
  })
  if (existing) {
    return NextResponse.json({ error: 'Student already has an active request for this book' }, { status: 400 })
  }

  const txData: any[] = [
    db.book_request.create({
      data: {
        book_id: parseInt(book_id),
        student_id: parseInt(student_id),
        issue_start_date: issue_start_date ? new Date(issue_start_date) : (status === 'issued' ? new Date() : null),
        issue_end_date: issue_end_date ? new Date(issue_end_date) : null,
        status: status || 'pending',
      },
    }),
  ]

  if (status === 'issued') {
    txData.push(
      db.book.update({
        where: { book_id: parseInt(book_id) },
        data: { issued_copies: { increment: 1 } },
      })
    )
  }

  const [request] = await db.$transaction(txData)
  return NextResponse.json(request, { status: 201 })
}

// PUT /api/librarian/requests — Update request status (approve/reject/return)
export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { book_request_id, status, return_date } = body

  if (!book_request_id) {
    return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
  }

  const validStatuses = ['pending', 'issued', 'returned', 'rejected']
  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
  }

  const request = await db.book_request.findUnique({
    where: { book_request_id: parseInt(book_request_id) },
    include: { book: true },
  })

  if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

  const txData: any[] = []

  // Accept (pending → issued): increment issued copies
  if (status === 'issued' && request.status === 'pending') {
    const available = request.book.total_copies - request.book.issued_copies
    if (available <= 0) {
      return NextResponse.json({ error: 'No copies available to issue' }, { status: 400 })
    }
    txData.push(
      db.book.update({
        where: { book_id: request.book_id },
        data: { issued_copies: { increment: 1 } },
      })
    )
  }

  // Return (issued → returned): decrement issued copies
  if (status === 'returned' && request.status === 'issued') {
    txData.push(
      db.book.update({
        where: { book_id: request.book_id },
        data: { issued_copies: { decrement: 1 } },
      })
    )
  }

  // Reject an issued book (edge case): decrement
  if (status === 'rejected' && request.status === 'issued') {
    txData.push(
      db.book.update({
        where: { book_id: request.book_id },
        data: { issued_copies: { decrement: 1 } },
      })
    )
  }

  txData.push(
    db.book_request.update({
      where: { book_request_id: parseInt(book_request_id) },
      data: {
        status,
        issue_start_date: status === 'issued' && !request.issue_start_date ? new Date() : request.issue_start_date,
        issue_end_date: return_date ? new Date(return_date) : (status === 'returned' ? new Date() : request.issue_end_date),
      },
    })
  )

  const [, updated] = await db.$transaction(txData)
  return NextResponse.json(updated)
}

// DELETE /api/librarian/requests — Delete a request
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
  }

  const request = await db.book_request.findUnique({ where: { book_request_id: parseInt(id) } })
  if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

  // If issued, decrement book copies before deleting
  if (request.status === 'issued') {
    await db.book.update({
      where: { book_id: request.book_id },
      data: { issued_copies: { decrement: 1 } },
    })
  }

  await db.book_request.delete({ where: { book_request_id: parseInt(id) } })
  return NextResponse.json({ success: true })
}
