import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { verifyStudent, studentError } from "@/lib/verify-student";

export async function GET(req: NextRequest) {
  const auth = await verifyStudent();
  if (auth.error) return studentError(auth.error);

  try {
    const studentId = auth.studentId;
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("exam_id");

    // Get student enrollment
    const enrollment = await db.enroll.findFirst({
      where: { student_id: studentId, mute: 0 },
      include: {
        class: { select: { class_id: true, name: true, name_numeric: true } },
        section: { select: { section_id: true, name: true } },
      },
      orderBy: { enroll_id: "desc" },
    });

    // Get exams available for this student
    const classId = enrollment?.class_id;
    const exams = classId
      ? await db.exam.findMany({
          where: { class_id: classId },
          select: { exam_id: true, name: true, date: true, year: true, type: true },
          orderBy: { date: "desc" },
        })
      : [];

    // Get grades
    const grades = await db.grade.findMany({
      orderBy: { grade_from: "asc" },
    });

    // Get terminal report if exam selected
    type TerminalReportData = {
      total_score: number;
      grade: string;
      rank: number;
      position: string;
      teacher_comment: string;
      head_comment: string;
    } | null;

    let terminalReport: TerminalReportData = null;
    let marks: {
      mark_id: number;
      mark_obtained: number;
      comment: string;
      subject: { subject_id: number; name: string } | null;
      exam: { exam_id: number; name: string } | null;
    }[] = [];

    if (examId && classId) {
      const exam = await db.exam.findUnique({
        where: { exam_id: parseInt(examId) },
      });

      marks = await db.mark.findMany({
        where: {
          student_id: studentId,
          exam_id: parseInt(examId),
        },
        select: {
          mark_id: true,
          mark_obtained: true,
          comment: true,
          subject: { select: { subject_id: true, name: true } },
          exam: { select: { exam_id: true, name: true } },
        },
        orderBy: { mark_id: "asc" },
      });

      if (exam) {
        const report = await db.terminal_reports.findFirst({
          where: {
            student_id: studentId,
            class_id: classId,
            year: exam.year || "",
          },
        });
        if (report) {
          terminalReport = {
            total_score: report.total_score,
            grade: report.grade,
            rank: report.rank,
            position: report.position,
            teacher_comment: report.teacher_comment,
            head_comment: report.head_comment,
          };
        }
      }
    }

    // Get student info
    const student = await db.student.findUnique({
      where: { student_id: studentId },
      select: {
        student_id: true,
        student_code: true,
        name: true,
        first_name: true,
        last_name: true,
        sex: true,
      },
    });

    return NextResponse.json({
      student,
      enrollment: enrollment
        ? {
            class_id: enrollment.class_id,
            class_name: enrollment.class.name,
            class_numeric: enrollment.class.name_numeric,
            section_name: enrollment.section.name,
          }
        : null,
      exams,
      grades,
      marks,
      terminalReport,
    });
  } catch (error) {
    console.error("Student marksheet error:", error);
    return NextResponse.json({ error: "Failed to load marksheet" }, { status: 500 });
  }
}
