import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/teacher-auth";

// GET /api/teacher/students/marksheet — marksheet data for teacher's students
export async function GET(request: NextRequest) {
  const { error, teacherId } = await requireTeacher();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const studentId = parseInt(searchParams.get("student_id") || "0");
    const examId = parseInt(searchParams.get("exam_id") || "0");
    const classId = parseInt(searchParams.get("class_id") || "0");

    if (!studentId) {
      return NextResponse.json({ error: "student_id is required" }, { status: 400 });
    }

    // Verify student is in teacher's class
    const teacherSubjects = await db.subject.findMany({
      where: { teacher_id: teacherId },
      select: { class_id: true },
    });
    const teacherClassIds = [...new Set(teacherSubjects.map((s) => s.class_id).filter(Boolean))];

    const classTeacherClasses = await db.school_class.findMany({
      where: { teacher_id: teacherId },
      select: { class_id: true },
    });
    for (const c of classTeacherClasses) {
      teacherClassIds.push(c.class_id);
    }

    // Get student's enrollment
    const enroll = await db.enroll.findFirst({
      where: { student_id: studentId, mute: 0 },
      orderBy: { enroll_id: "desc" },
      include: {
        class: { select: { class_id: true, name: true, name_numeric: true, category: true } },
        section: { select: { name: true } },
      },
    });

    if (!enroll) {
      return NextResponse.json({ error: "Student enrollment not found" }, { status: 404 });
    }

    const effectiveClassId = classId || enroll.class_id;
    if (!teacherClassIds.includes(effectiveClassId)) {
      return NextResponse.json({ error: "Not authorized for this student" }, { status: 403 });
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
        birthday: true,
        parent: { select: { name: true, phone: true } },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get grades
    const grades = await db.grade.findMany({ orderBy: { grade_from: "desc" } });
    const getGrade = (score: number) => {
      for (const g of grades) {
        if (score >= g.grade_from && score <= g.grade_to) {
          return { name: g.name, comment: g.comment };
        }
      }
      return { name: "F", comment: "Fail" };
    };

    // Get subjects
    const subjects = await db.subject.findMany({
      where: { class_id: effectiveClassId, status: 1 },
      orderBy: { name: "asc" },
    });

    // Get marks
    const markWhere: Record<string, unknown> = { student_id: studentId, class_id: effectiveClassId };
    if (examId) markWhere.exam_id = examId;

    const marks = await db.mark.findMany({
      where: markWhere,
      include: { subject: { select: { subject_id: true, name: true } } },
    });

    // Build marksheet
    const marksheet: Array<{
      subject_id: number;
      subject_name: string;
      mark_obtained: number;
      grade_name: string;
      grade_comment: string;
      remark: string;
      teacher_comment: string;
    }> = [];

    let totalScore = 0;
    let subjectsScored = 0;

    for (const subject of subjects) {
      const mark = marks.find((m) => m.subject_id === subject.subject_id);
      const score = mark ? mark.mark_obtained : 0;
      const grade = getGrade(score);

      marksheet.push({
        subject_id: subject.subject_id,
        subject_name: subject.name,
        mark_obtained: score,
        grade_name: grade.name,
        grade_comment: grade.comment,
        remark: score >= 50 ? "Credit" : "Fail",
        teacher_comment: mark?.comment || "",
      });

      if (mark) {
        totalScore += score;
        subjectsScored++;
      }
    }

    // Get exam info
    let examInfo = null;
    if (examId) {
      examInfo = await db.exam.findUnique({
        where: { exam_id: examId },
        select: { exam_id: true, name: true, date: true, year: true, type: true },
      });
    }

    // Available exams for this class
    const availableExams = await db.exam.findMany({
      where: { class_id: effectiveClassId },
      select: { exam_id: true, name: true, year: true, type: true, date: true },
      orderBy: { date: "desc" },
    });

    // Other students in class
    const otherStudents = await db.enroll.findMany({
      where: { class_id: effectiveClassId, mute: 0, student_id: { not: studentId } },
      include: { student: { select: { student_id: true, name: true } } },
      take: 50,
      orderBy: { roll: "asc" },
    });

    return NextResponse.json({
      student,
      class: {
        class_id: effectiveClassId,
        name: enroll.class.name,
        section_name: enroll.section.name,
      },
      exam: examInfo,
      subjects: marksheet,
      totalScore,
      subjectsScored,
      subjectsTotal: subjects.length,
      average: subjectsScored > 0 ? Math.round((totalScore / subjectsScored) * 10) / 10 : 0,
      overallGrade: getGrade(subjectsScored > 0 ? totalScore / subjectsScored : 0),
      otherStudents: otherStudents.map((e) => ({
        student_id: e.student.student_id,
        name: e.student.name,
      })),
      availableExams,
    });
  } catch (err) {
    console.error("Teacher marksheet error:", err);
    return NextResponse.json({ error: "Failed to load marksheet" }, { status: 500 });
  }
}
