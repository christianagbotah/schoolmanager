import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/teacher-auth";

// GET /api/teacher/colleagues — list all teachers in the school
export async function GET(request: NextRequest) {
  const { error, teacherId } = await requireTeacher();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = { active_status: 1 };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { teacher_code: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const teachers = await db.teacher.findMany({
      where,
      select: {
        teacher_id: true,
        teacher_code: true,
        name: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        gender: true,
        blood_group: true,
        designation: {
          select: { id: true, des_name: true },
        },
        department: {
          select: { id: true, dep_name: true },
        },
        subjects: {
          select: { name: true, class: { select: { name: true } } },
          take: 3,
        },
        _count: {
          select: { subjects: true },
        },
      },
      orderBy: { name: "asc" },
      take: 100,
    });

    const formatted = teachers.map((t) => ({
      ...t,
      designation_name: t.designation?.des_name || "",
      department_name: t.department?.dep_name || "",
      subject_count: t._count?.subjects || 0,
      top_subjects: t.subjects.map((s) => s.name),
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("Teacher colleagues error:", err);
    return NextResponse.json({ error: "Failed to load colleagues" }, { status: 500 });
  }
}
