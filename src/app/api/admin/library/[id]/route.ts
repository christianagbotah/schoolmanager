import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/library/[id] - Get a single book
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const book = await db.book.findUnique({
      where: { book_id: parseInt(id) },
      include: {
        book_requests: {
          include: {
            student: { select: { student_id: true, name: true, student_code: true } },
          },
          orderBy: { book_request_id: 'desc' },
          take: 20,
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json(book);
  } catch (error) {
    console.error('Error fetching book:', error);
    return NextResponse.json({ error: 'Failed to fetch book' }, { status: 500 });
  }
}

// PUT /api/admin/library/[id] - Update a book
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id);
    const body = await request.json();

    const existing = await db.book.findUnique({ where: { book_id: bookId } });
    if (!existing) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.author !== undefined) updateData.author = body.author;
    if (body.isbn !== undefined) updateData.isbn = body.isbn;
    if (body.category !== undefined) updateData.category = body.category === '__none__' ? '' : body.category;
    if (body.shelf !== undefined) updateData.shelf = body.shelf;
    if (body.class_id !== undefined) updateData.class_id = body.class_id ? parseInt(body.class_id) : null;
    if (body.price !== undefined) updateData.price = body.price ? parseFloat(body.price) : 0;
    if (body.total_copies !== undefined) updateData.total_copies = parseInt(body.total_copies);
    if (body.status !== undefined) updateData.status = body.status;

    const updated = await db.book.update({
      where: { book_id: bookId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating book:', error);
    return NextResponse.json({ error: 'Failed to update book' }, { status: 500 });
  }
}

// DELETE /api/admin/library/[id] - Delete a book
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id);

    const existing = await db.book.findUnique({ where: { book_id: bookId } });
    if (!existing) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    await db.book_request.deleteMany({ where: { book_id: bookId } });
    await db.book.delete({ where: { book_id: bookId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 });
  }
}
