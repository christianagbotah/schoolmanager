import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireTeacher } from "@/lib/teacher-auth";

// GET /api/teacher/library — library books (read-only for teachers)
export async function GET() {
  const { error } = await requireTeacher();
  if (error) return error;

  try {
    const books = await db.book.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(books);
  } catch (err) {
    console.error("Teacher library error:", err);
    return NextResponse.json({ error: "Failed to load books" }, { status: 500 });
  }
}
