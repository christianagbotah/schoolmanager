import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { verifyStudent, studentError } from "@/lib/verify-student";

export async function GET(req: NextRequest) {
  const auth = await verifyStudent();
  if (auth.error) return studentError(auth.error);

  try {
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("exam_id");
    const studentId = auth.studentId;

    // Fetch available exams (exams that have marks for this student)
    const exams = await db.mark.findMany({
      where: { student_id: studentId, exam_id: { not: null } },
      distinct: ["exam_id"],
      select: {
        exam: {
          select: {
            exam_id: true,
            name: true,
            type: true,
            year: true,
            date: true,
          },
        },
      },
      orderBy: { exam_id: "desc" },
    });

    const examList = exams
      .filter((e) => e.exam)
      .map((e) => e.exam!);

    // Fetch marks for specific exam if requested
    if (examId) {
      const marks = await db.mark.findMany({
        where: { student_id: studentId, exam_id: parseInt(examId) },
        include: {
          subject: { select: { subject_id: true, name: true } },
          exam: { select: { exam_id: true, name: true, type: true, year: true } },
        },
        orderBy: { mark_id: "asc" },
      });
      return NextResponse.json({ exams: examList, marks });
    }

    // Fetch all marks for the student
    const allMarks = await db.mark.findMany({
      where: { student_id: studentId },
      include: {
        subject: { select: { subject_id: true, name: true } },
        exam: { select: { exam_id: true, name: true, type: true, year: true } },
      },
      orderBy: { mark_id: "desc" },
      take: 200,
    });

    return NextResponse.json({ exams: examList, marks: allMarks });
  } catch (error) {
    console.error("Student results error:", error);
    return NextResponse.json({ error: "Failed to load results" }, { status: 500 });
  }
}
