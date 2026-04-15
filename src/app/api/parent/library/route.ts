import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const parentId = parseInt(session.user.id);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Get children IDs
    const children = await db.student.findMany({
      where: { parent_id: parentId },
      select: { student_id: true, name: true, first_name: true, last_name: true, student_code: true },
    });
    const childIds = children.map(c => c.student_id);

    // Get books
    const booksWhere: Record<string, unknown> = {};
    if (search) {
      booksWhere.OR = [
        { name: { contains: search } },
        { author: { contains: search } },
      ];
    }

    const books = await db.book.findMany({
      where: booksWhere,
      select: {
        book_id: true,
        name: true,
        description: true,
        author: true,
        class_id: true,
        price: true,
        total_copies: true,
        issued_copies: true,
        status: true,
      },
      orderBy: { name: 'asc' },
    });

    // Get book requests for children
    const requests = childIds.length > 0
      ? await db.book_request.findMany({
          where: { student_id: { in: childIds } },
          orderBy: { issue_start_date: 'desc' },
          select: {
            book_request_id: true,
            book_id: true,
            student_id: true,
            issue_start_date: true,
            issue_end_date: true,
            status: true,
            book: { select: { name: true, author: true } },
            student: { select: { name: true, student_code: true } },
          },
        })
      : [];

    const bookList = books.map(b => ({
      ...b,
      available: b.total_copies - b.issued_copies,
      copies: b.total_copies,
    }));

    return NextResponse.json({ books: bookList, requests, children });
  } catch (error) {
    console.error('Parent library error:', error);
    return NextResponse.json({ error: 'Failed to load library data' }, { status: 500 });
  }
}
