import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/book-requests - List requests with stats
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search') || ''

  const where: Record<string, unknown> = {}
  if (status) where.status = status

  if (search) {
    where.OR = [
      { book: { name: { contains: search } } },
      { student: { name: { contains: search } } },
      { student: { student_code: { contains: search } } },
    ]
  }

  const [requests, statusGroups] = await Promise.all([
    db.book_request.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        book: { select: { book_id: true, name: true, author: true, total_copies: true, issued_copies: true } },
        student: { select: { student_id: true, name: true, student_code: true } },
      },
      orderBy: { book_request_id: 'desc' },
      take: 500,
    }),
    db.book_request.groupBy({
      by: ['status'],
      _count: { book_request_id: true },
    }),
  ])

  // Calculate overdue: issued requests where issue_end_date < now
  const now = new Date()
  const overdueCount = requests.filter(
    (r) => r.status === 'issued' && r.issue_end_date && new Date(r.issue_end_date) < now
  ).length

  const stats = {
    total: requests.length,
    pending: statusGroups.find((r) => r.status === 'pending')?._count.book_request_id || 0,
    issued: statusGroups.find((r) => r.status === 'issued')?._count.book_request_id || 0,
    returned: statusGroups.find((r) => r.status === 'returned')?._count.book_request_id || 0,
    rejected: statusGroups.find((r) => r.status === 'rejected')?._count.book_request_id || 0,
    overdue: overdueCount,
  }

  return NextResponse.json({ data: requests, stats })
}

// POST /api/book-requests - Create request (new issue or student request)
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

  // Create request and optionally increment issued copies
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

// PUT /api/book-requests - Accept/Reject/Return a request
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

  // Reject (pending → rejected): no copy change needed
  // If issued was rejected (edge case): decrement
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
