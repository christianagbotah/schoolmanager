import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireTeacher } from "@/lib/teacher-auth";

// GET /api/teacher/exams — teacher's online exams
export async function GET() {
  const { error, teacherId } = await requireTeacher();
  if (error) return error;

  try {
    // Exams where teacher is the class teacher or teaches the subject
    const teacherClassIds = await db.school_class.findMany({
      where: { teacher_id: teacherId },
      select: { class_id: true },
    });
    const classIds = teacherClassIds.map((c) => c.class_id);

    const teacherSubjectIds = await db.subject.findMany({
      where: { teacher_id: teacherId },
      select: { subject_id: true },
    });
    const subjectIds = teacherSubjectIds.map((s) => s.subject_id);

    const exams = await db.onlineExam.findMany({
      where: {
        OR: [
          ...(classIds.length > 0 ? [{ class_id: { in: classIds } }] : []),
          ...(subjectIds.length > 0 ? [{ subject_id: { in: subjectIds } }] : []),
        ],
      },
      include: {
        subject: { select: { subject_id: true, name: true } },
        class: { select: { class_id: true, name: true } },
        results: {
          select: { online_exam_result_id: true, student_id: true, obtained_mark: true, total_mark: true, status: true },
        },
        _count: { select: { results: true } },
      },
      orderBy: { online_exam_id: "desc" },
    });

    return NextResponse.json(exams);
  } catch (err) {
    console.error("Teacher exams error:", err);
    return NextResponse.json({ error: "Failed to load exams" }, { status: 500 });
  }
}
