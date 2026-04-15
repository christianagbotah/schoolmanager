import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { verifyStudent, studentError } from "@/lib/verify-student";

export async function GET(req: NextRequest) {
  const auth = await verifyStudent();
  if (auth.error) return studentError(auth.error);

  try {
    const studentId = auth.studentId;

    const [books, requests] = await Promise.all([
      db.book.findMany({
        orderBy: { name: "asc" },
      }),
      db.book_request.findMany({
        where: { student_id: studentId },
        include: {
          book: { select: { name: true, author: true } },
        },
        orderBy: { book_request_id: "desc" },
      }),
    ]);

    const booksWithAvailability = books.map((b) => ({
      book_id: b.book_id,
      name: b.name,
      author: b.author,
      description: b.description,
      price: b.price,
      available: (b.total_copies || 0) - (b.issued_copies || 0),
      total_copies: b.total_copies,
    }));

    return NextResponse.json({
      books: booksWithAvailability,
      requests,
    });
  } catch (error) {
    console.error("Student library error:", error);
    return NextResponse.json({ error: "Failed to load library data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyStudent();
  if (auth.error) return studentError(auth.error);

  try {
    const body = await req.json();
    const { book_id } = body;

    if (!book_id) {
      return NextResponse.json({ error: "Book ID is required" }, { status: 400 });
    }

    // Check if already has pending/issued request
    const existingRequest = await db.book_request.findFirst({
      where: {
        student_id: auth.studentId,
        book_id: parseInt(book_id),
        status: { in: ["pending", "issued"] },
      },
    });

    if (existingRequest) {
      return NextResponse.json({ error: "You already have a pending or active request for this book" }, { status: 400 });
    }

    // Check book availability
    const book = await db.book.findUnique({ where: { book_id: parseInt(book_id) } });
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const available = (book.total_copies || 0) - (book.issued_copies || 0);
    if (available <= 0) {
      return NextResponse.json({ error: "Book is not available" }, { status: 400 });
    }

    await db.book_request.create({
      data: {
        book_id: parseInt(book_id),
        student_id: auth.studentId,
        status: "pending",
        issue_start_date: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: "Book request submitted successfully" });
  } catch (error) {
    console.error("Student book request error:", error);
    return NextResponse.json({ error: "Failed to submit book request" }, { status: 500 });
  }
}
