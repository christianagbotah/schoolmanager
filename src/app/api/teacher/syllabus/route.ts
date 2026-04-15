import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/teacher-auth";
import { getSettings } from "@/lib/settings";

// GET /api/teacher/syllabus — teacher's syllabus
export async function GET() {
  const { error, teacherId } = await requireTeacher();
  if (error) return error;

  try {
    const settings = await getSettings();
    const runningYear = settings.running_year || "";

    const teacherSubjects = await db.subject.findMany({
      where: { teacher_id: teacherId, ...(runningYear ? { year: runningYear } : {}) },
      select: { subject_id: true, class_id: true },
    });

    const subjectIds = teacherSubjects.map((s) => s.subject_id);
    const classIds = [...new Set(teacherSubjects.map((s) => s.class_id).filter(Boolean))];

    const syllabi = await db.academicSyllabus.findMany({
      where: {
        ...(subjectIds.length > 0 ? { subject_id: { in: subjectIds } } : {}),
        ...(classIds.length > 0 ? { class_id: { in: classIds } } : {}),
        year: runningYear,
      },
      include: {
        class: { select: { class_id: true, name: true } },
        subject: { select: { subject_id: true, name: true } },
      },
      orderBy: { timestamp: "desc" },
    });

    return NextResponse.json(syllabi);
  } catch (err) {
    console.error("Teacher syllabus error:", err);
    return NextResponse.json({ error: "Failed to load syllabus" }, { status: 500 });
  }
}
