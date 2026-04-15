import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireTeacher } from "@/lib/teacher-auth";

// GET /api/teacher/notices — notices visible to teachers
export async function GET() {
  const { error, teacherId } = await requireTeacher();
  if (error) return error;

  try {
    const notices = await db.notice.findMany({
      where: {
        status: 1,
        OR: [
          { visibility_roles: "all" },
          { visibility_roles: { contains: "teacher" } },
        ],
      },
      orderBy: { create_timestamp: "desc" },
      select: {
        id: true, title: true, notice: true, timestamp: true,
        create_timestamp: true, is_pinned: true,
        start_date: true, end_date: true, attachment: true, image: true,
      },
    });

    return NextResponse.json(notices);
  } catch (err) {
    console.error("Teacher notices error:", err);
    return NextResponse.json({ error: "Failed to load notices" }, { status: 500 });
  }
}
