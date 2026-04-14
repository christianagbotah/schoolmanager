import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (status) where.status = status

  const requests = await db.book_request.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    include: {
      book: { select: { book_id: true, name: true, author: true } },
      student: { select: { student_id: true, name: true, student_code: true } },
    },
    orderBy: { book_request_id: 'desc' },
    take: 200,
  })

  return NextResponse.json(requests)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { book_id, student_id, issue_start_date, issue_end_date, status } = body

  if (!book_id || !student_id) {
    return NextResponse.json({ error: 'book_id and student_id are required' }, { status: 400 })
  }

  // Check available copies
  const book = await db.book.findUnique({ where: { book_id: parseInt(book_id) } })
  if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 })

  const available = book.total_copies - book.issued_copies
  if (available <= 0) {
    return NextResponse.json({ error: 'No copies available' }, { status: 400 })
  }

  // Create request and increment issued copies
  const [request] = await db.$transaction([
    db.book_request.create({
      data: {
        book_id: parseInt(book_id),
        student_id: parseInt(student_id),
        issue_start_date: issue_start_date ? new Date(issue_start_date) : new Date(),
        issue_end_date: issue_end_date ? new Date(issue_end_date) : null,
        status: status || 'issued',
      },
    }),
    db.book.update({
      where: { book_id: parseInt(book_id) },
      data: { issued_copies: { increment: 1 } },
    }),
  ])

  return NextResponse.json(request, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { book_request_id, status, return_date } = body

  if (!book_request_id) {
    return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
  }

  const request = await db.book_request.findUnique({
    where: { book_request_id: parseInt(book_request_id) },
  })

  if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

  // If returning, decrement issued copies
  if (status === 'returned' && request.status !== 'returned') {
    await db.book.update({
      where: { book_id: request.book_id },
      data: { issued_copies: { decrement: 1 } },
    })
  }

  const updated = await db.book_request.update({
    where: { book_request_id: parseInt(book_request_id) },
    data: {
      status: status || request.status,
      issue_end_date: return_date ? new Date(return_date) : (status === 'returned' ? new Date() : request.issue_end_date),
    },
  })

  return NextResponse.json(updated)
}
