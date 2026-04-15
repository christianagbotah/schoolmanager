import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const requests = await db.book_request.findMany({
      include: {
        book: { select: { book_id: true, name: true, author: true } },
        student: { select: { student_id: true, name: true, student_code: true } },
      },
      orderBy: { book_request_id: 'desc' },
    });
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching book requests:', error);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { book_id, student_id, issue_start_date, issue_end_date, status } = body;

    if (!book_id || !student_id) {
      return NextResponse.json({ error: 'Book and student are required' }, { status: 400 });
    }

    const book = await db.book.findUnique({ where: { book_id: parseInt(book_id) } });
    if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    if (book.issued_copies >= book.total_copies) {
      return NextResponse.json({ error: 'No copies available' }, { status: 400 });
    }

    const requestRecord = await db.book_request.create({
      data: {
        book_id: parseInt(book_id),
        student_id: parseInt(student_id),
        issue_start_date: issue_start_date ? new Date(issue_start_date) : new Date(),
        issue_end_date: issue_end_date ? new Date(issue_end_date) : null,
        status: status || 'issued',
      },
    });

    await db.book.update({
      where: { book_id: parseInt(book_id) },
      data: { issued_copies: { increment: 1 } },
    });

    return NextResponse.json(requestRecord, { status: 201 });
  } catch (error) {
    console.error('Error creating book request:', error);
    return NextResponse.json({ error: 'Failed to issue book' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { book_request_id, status } = body;

    if (!book_request_id) return NextResponse.json({ error: 'Request ID required' }, { status: 400 });

    const requestRecord = await db.book_request.findUnique({ where: { book_request_id: parseInt(book_request_id) } });
    if (!requestRecord) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

    const updated = await db.book_request.update({
      where: { book_request_id: parseInt(book_request_id) },
      data: { status: status || 'returned' },
    });

    if (status === 'returned' && requestRecord.status !== 'returned') {
      await db.book.update({
        where: { book_id: requestRecord.book_id },
        data: { issued_copies: { decrement: 1 } },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating book request:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
