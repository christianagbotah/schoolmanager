import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { verifyStudent, studentError } from "@/lib/verify-student";

export async function GET(req: NextRequest) {
  const auth = await verifyStudent();
  if (auth.error) return studentError(auth.error);

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "available";
    const studentId = auth.studentId;

    if (type === "available") {
      // Fetch active online exams for the student's class
      const enroll = await db.enroll.findFirst({
        where: { student_id: studentId, mute: 0 },
        orderBy: { enroll_id: "desc" },
      });

      const where: Record<string, unknown> = { status: "published" };
      if (enroll) where.class_id = enroll.class_id;

      const exams = await db.onlineExam.findMany({
        where,
        include: {
          subject: { select: { name: true } },
          class: { select: { name: true } },
        },
        orderBy: { start_date: "desc" },
      });

      // Check which exams the student has already submitted
      const results = await db.online_exam_result.findMany({
        where: { student_id: studentId },
        select: { exam_id: true },
      });
      const submittedExamIds = new Set(results.map((r) => r.exam_id));

      const examList = exams.map((e) => ({
        id: e.online_exam_id,
        title: e.title,
        subject: e.subject?.name || "",
        class: e.class?.name || "",
        duration: e.duration,
        start_date: e.start_date,
        end_date: e.end_date,
        instructions: e.instructions,
        minimum_percentage: e.minimum_percentage,
        status: e.status,
        submitted: submittedExamIds.has(e.online_exam_id),
      }));

      return NextResponse.json({ exams: examList });
    }

    if (type === "results") {
      const results = await db.online_exam_result.findMany({
        where: { student_id: studentId },
        include: {
          exam: { select: { title: true, subject: { select: { name: true } } } },
        },
        orderBy: { online_exam_result_id: "desc" },
      });

      const resultList = results.map((r) => ({
        id: r.online_exam_result_id,
        exam_id: r.exam_id,
        exam_title: r.exam?.title || "",
        subject: r.exam?.subject?.name || "",
        score: r.obtained_mark,
        total: r.total_mark,
        status: r.status,
        submitted_at: r.online_exam_result_id,
      }));

      return NextResponse.json({ results: resultList });
    }

    return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
  } catch (error) {
    console.error("Student online exams error:", error);
    return NextResponse.json({ error: "Failed to load online exams" }, { status: 500 });
  }
}
