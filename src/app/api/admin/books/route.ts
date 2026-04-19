import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { author: { contains: search } },
        { isbn: { contains: search } },
        { category: { contains: search } },
      ];
    }

    const books = await db.book.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { book_id: 'desc' },
    });

    return NextResponse.json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name, description, author, isbn, category, shelf,
      class_id, price, total_copies, status,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Book name is required' }, { status: 400 });
    }

    const book = await db.book.create({
      data: {
        name: name.trim(),
        description: description || '',
        author: author || '',
        isbn: isbn || '',
        category: category === '__none__' ? '' : (category || ''),
        shelf: shelf || '',
        class_id: class_id ? parseInt(class_id) : null,
        price: price ? parseFloat(price) : 0,
        total_copies: total_copies ? parseInt(total_copies) : 1,
        issued_copies: 0,
        status: status || 'available',
      },
    });

    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    console.error('Error creating book:', error);
    return NextResponse.json({ error: 'Failed to create book' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Book ID required' }, { status: 400 });

    const body = await request.json();
    const {
      name, description, author, isbn, category, shelf,
      class_id, price, total_copies, status,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (author !== undefined) updateData.author = author;
    if (isbn !== undefined) updateData.isbn = isbn;
    if (category !== undefined) updateData.category = category === '__none__' ? '' : category;
    if (shelf !== undefined) updateData.shelf = shelf;
    if (class_id !== undefined) updateData.class_id = class_id ? parseInt(class_id) : null;
    if (price !== undefined) updateData.price = price ? parseFloat(price) : 0;
    if (total_copies !== undefined) updateData.total_copies = parseInt(total_copies);
    if (status !== undefined) updateData.status = status;

    const book = await db.book.update({
      where: { book_id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json(book);
  } catch (error) {
    console.error('Error updating book:', error);
    return NextResponse.json({ error: 'Failed to update book' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Book ID required' }, { status: 400 });

    await db.book_request.deleteMany({ where: { book_id: parseInt(id) } });
    await db.book.delete({ where: { book_id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 });
  }
}
