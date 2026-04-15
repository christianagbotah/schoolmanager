import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/librarian/returns - Book returns management
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get all issued books
    const where: Record<string, unknown> = { status: 'issued' };

    if (search) {
      where.OR = [
        { book: { name: { contains: search } } },
        { book: { author: { contains: search } } },
        { student: { name: { contains: search } } },
        { student: { student_code: { contains: search } } },
      ];
    }

    const [issuedBooks, totalCount] = await Promise.all([
      db.book_request.findMany({
        where: Object.keys(where).length > 0 ? where : { status: 'issued' },
        include: {
          book: { select: { book_id: true, name: true, author: true, isbn: true, category: true } },
          student: { select: { student_id: true, name: true, student_code: true } },
        },
        orderBy: { issue_end_date: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.book_request.count({ where: Object.keys(where).length > 0 ? where : { status: 'issued' } }),
    ]);

    // Calculate fines for each issued book
    const finePerDay = 0.50; // GHS 0.50 per day
    const today = new Date();

    const enrichedBooks = issuedBooks.map((req: any) => {
      let daysOverdue = 0;
      let fine = 0;
      let isOverdue = false;

      if (req.issue_end_date) {
        const dueDate = new Date(req.issue_end_date);
        const diffTime = today.getTime() - dueDate.getTime();
        daysOverdue = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        isOverdue = daysOverdue > 0;
        fine = daysOverdue * finePerDay;
      }

      // Calculate days issued
      let daysIssued = 0;
      if (req.issue_start_date) {
        const startDate = new Date(req.issue_start_date);
        daysIssued = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      }

      return {
        ...req,
        daysOverdue,
        fine: Math.round(fine * 100) / 100,
        isOverdue,
        daysIssued,
      };
    });

    // Summary stats
    const overdueCount = enrichedBooks.filter(b => b.isOverdue).length;
    const totalFines = enrichedBooks.reduce((s: number, b: any) => s + b.fine, 0);

    // Recently returned books (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentReturns = await db.book_request.findMany({
      where: {
        status: 'returned',
        // Note: we don't have a return_date field, so we can't filter by date easily
      },
      include: {
        book: { select: { name: true, author: true } },
        student: { select: { name: true, student_code: true } },
      },
      orderBy: { book_request_id: 'desc' },
      take: 10,
    });

    // Stats
    const allIssued = await db.book_request.count({ where: { status: 'issued' } });
    const allReturned = await db.book_request.count({ where: { status: 'returned' } });

    return NextResponse.json({
      data: enrichedBooks,
      pagination: { page, limit, total: totalCount, totalPages: Math.ceil(totalCount / limit) },
      recentReturns,
      stats: {
        totalIssued: allIssued,
        totalReturned: allReturned,
        overdueCount,
        totalFines: Math.round(totalFines * 100) / 100,
        finePerDay,
      },
    });
  } catch (error) {
    console.error('Error fetching returns:', error);
    return NextResponse.json({ error: 'Failed to fetch return data' }, { status: 500 });
  }
}

// POST /api/librarian/returns - Process book return
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { book_request_id, waiveFine } = body;

    if (!book_request_id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    const request = await db.book_request.findUnique({
      where: { book_request_id: parseInt(book_request_id) },
      include: {
        book: true,
        student: { select: { name: true, student_code: true } },
      },
    });

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (request.status !== 'issued') {
      return NextResponse.json({ error: 'Book is not currently issued' }, { status: 400 });
    }

    // Calculate fine
    const finePerDay = 0.50;
    let daysOverdue = 0;
    let fine = 0;

    if (request.issue_end_date) {
      const dueDate = new Date(request.issue_end_date);
      const diffTime = Date.now() - dueDate.getTime();
      daysOverdue = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      fine = daysOverdue * finePerDay;
    }

    // Update request status and decrement book issued copies
    await db.$transaction([
      db.book_request.update({
        where: { book_request_id: parseInt(book_request_id) },
        data: {
          status: 'returned',
          issue_end_date: new Date(),
        },
      }),
      db.book.update({
        where: { book_id: request.book_id },
        data: { issued_copies: { decrement: 1 } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Book "${request.book.name}" returned successfully by ${request.student?.name}`,
      fineInfo: {
        daysOverdue,
        fine: Math.round(fine * 100) / 100,
        waived: waiveFine || false,
      },
    });
  } catch (error: any) {
    console.error('Return processing error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process return' }, { status: 500 });
  }
}
