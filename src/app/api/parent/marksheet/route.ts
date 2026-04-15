import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const parentId = parseInt(session.user.id);
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("student_id");
    const examId = searchParams.get("exam_id");

    // Get children
    const children = await db.student.findMany({
      where: { parent_id: parentId },
      select: {
        student_id: true,
        name: true,
        first_name: true,
        last_name: true,
        student_code: true,
        sex: true,
        mute: true,
      },
    });

    const childIds = children.map((c) => c.student_id);

    if (childIds.length === 0) {
      return NextResponse.json({
        children: [],
        exams: [],
        grades: [],
        marks: [],
        terminalReport: null,
        student: null,
        enrollment: null,
      });
    }

    // Get enrollments for exams
    const enrollments = await db.enroll.findMany({
      where: { student_id: { in: childIds } },
      select: { class_id: true, section_id: true },
      distinct: ["class_id", "section_id"],
    });
    const classIds = enrollments.map((e) => e.class_id);

    // Get exams
    const exams = classIds.length > 0
      ? await db.exam.findMany({
          where: { class_id: { in: classIds } },
          select: { exam_id: true, name: true, date: true, year: true, type: true },
          orderBy: { date: "desc" },
        })
      : [];

    // Get grades
    const grades = await db.grade.findMany({
      orderBy: { grade_from: "asc" },
    });

    // Types
    type TerminalReportData = {
      total_score: number;
      grade: string;
      rank: number;
      position: string;
      teacher_comment: string;
      head_comment: string;
    } | null;

    // Get marks if filters applied
    let marks: {
      mark_id: number;
      mark_obtained: number;
      comment: string;
      subject: { subject_id: number; name: string } | null;
      exam: { exam_id: number; name: string } | null;
    }[] = [];

    let selectedStudent: {
      student_id: number;
      student_code: string;
      name: string;
      first_name: string;
      last_name: string;
      sex: string;
    } | null = null;

    let selectedEnrollment: {
      enroll_id: number;
      class_id: number;
      section_id: number;
      class: { class_id: number; name: string; name_numeric: number };
      section: { section_id: number; name: string };
    } | null = null;

    let terminalReport: TerminalReportData = null;

    if (studentId && examId) {
      const sid = parseInt(studentId);
      const eid = parseInt(examId);

      marks = await db.mark.findMany({
        where: { student_id: sid, exam_id: eid },
        select: {
          mark_id: true,
          mark_obtained: true,
          comment: true,
          subject: { select: { subject_id: true, name: true } },
          exam: { select: { exam_id: true, name: true } },
        },
        orderBy: { mark_id: "asc" },
      });

      selectedStudent = await db.student.findUnique({
        where: { student_id: sid },
        select: {
          student_id: true,
          student_code: true,
          name: true,
          first_name: true,
          last_name: true,
          sex: true,
        },
      });

      selectedEnrollment = await db.enroll.findFirst({
        where: { student_id: sid, mute: 0 },
        include: {
          class: { select: { class_id: true, name: true, name_numeric: true } },
          section: { select: { section_id: true, name: true } },
        },
        orderBy: { enroll_id: "desc" },
      });

      const exam = await db.exam.findUnique({ where: { exam_id: eid } });
      if (exam && selectedEnrollment) {
        const report = await db.terminal_reports.findFirst({
          where: {
            student_id: sid,
            class_id: selectedEnrollment.class_id,
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

    return NextResponse.json({
      children,
      exams,
      grades,
      marks,
      student: selectedStudent,
      enrollment: selectedEnrollment
        ? {
            class_id: selectedEnrollment.class_id,
            class_name: selectedEnrollment.class.name,
            class_numeric: selectedEnrollment.class.name_numeric,
            section_name: selectedEnrollment.section.name,
          }
        : null,
      terminalReport,
    });
  } catch (error) {
    console.error("Parent marksheet error:", error);
    return NextResponse.json({ error: "Failed to load marksheet" }, { status: 500 });
  }
}
