import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireTeacher } from "@/lib/teacher-auth";
import { getSettings } from "@/lib/settings";

// GET /api/teacher/subjects — teacher's subjects
export async function GET() {
  const { error, teacherId } = await requireTeacher();
  if (error) return error;

  try {
    const settings = await getSettings();
    const runningYear = settings.running_year || "";
    const runningTerm = settings.running_term || "";

    const subjects = await db.subject.findMany({
      where: {
        teacher_id: teacherId,
        ...(runningYear ? { year: runningYear } : {}),
        ...(runningTerm ? { term: parseInt(runningTerm) || undefined } : {}),
      },
      include: {
        class: {
          select: { class_id: true, name: true, name_numeric: true, category: true },
        },
        section: {
          select: { section_id: true, name: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(subjects);
  } catch (err) {
    console.error("Teacher subjects error:", err);
    return NextResponse.json({ error: "Failed to load subjects" }, { status: 500 });
  }
}
