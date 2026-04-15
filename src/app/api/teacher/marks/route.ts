import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/teacher-auth";

// GET /api/teacher/marks — teacher's subjects, exams, student marks
export async function GET(request: NextRequest) {
  const { error, teacherId } = await requireTeacher();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subject_id");
    const examId = searchParams.get("exam_id");
    const classId = searchParams.get("class_id");
    const sectionId = searchParams.get("section_id");
    const studentId = searchParams.get("student_id");

    // Get teacher's subjects
    const subjects = await db.subject.findMany({
      where: { teacher_id: teacherId },
      include: {
        class: {
          select: { class_id: true, name: true, name_numeric: true },
        },
        section: {
          select: { section_id: true, name: true },
        },
      },
    });

    // Get exams for teacher's classes
    const teacherClassIds = [...new Set(subjects.map((s) => s.class_id).filter(Boolean))];
    const exams = teacherClassIds.length > 0
      ? await db.exam.findMany({
          where: { class_id: { in: teacherClassIds } },
          orderBy: { date: "desc" },
        })
      : [];

    // Get marks if filters provided
    let marks = [];
    if (subjectId && examId) {
      marks = await db.mark.findMany({
        where: {
          subject_id: parseInt(subjectId),
          exam_id: parseInt(examId),
          ...(classId ? { class_id: parseInt(classId) } : {}),
          ...(sectionId ? { section_id: parseInt(sectionId) } : {}),
          ...(studentId ? { student_id: parseInt(studentId) } : {}),
        },
        include: {
          student: {
            select: { student_id: true, name: true, student_code: true },
          },
          subject: {
            select: { subject_id: true, name: true },
          },
          exam: {
            select: { exam_id: true, name: true },
          },
        },
      });
    }

    return NextResponse.json({ subjects, exams, marks });
  } catch (err) {
    console.error("Teacher marks error:", err);
    return NextResponse.json({ error: "Failed to load marks" }, { status: 500 });
  }
}

// POST /api/teacher/marks — save marks
export async function POST(request: NextRequest) {
  const { error, teacherId } = await requireTeacher();
  if (error) return error;

  try {
    const body = await request.json();
    const { records } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: "No records provided" }, { status: 400 });
    }

    // Validate that these subjects belong to this teacher
    const subjectIds = [...new Set(records.map((r: { subject_id: number }) => r.subject_id).filter(Boolean))];
    const teacherSubjects = await db.subject.findMany({
      where: {
        subject_id: { in: subjectIds },
        teacher_id: teacherId,
      },
    });

    if (teacherSubjects.length === 0) {
      return NextResponse.json({ error: "No valid subjects for this teacher" }, { status: 403 });
    }

    // Upsert marks
    let count = 0;
    for (const rec of records) {
      const existing = await db.mark.findFirst({
        where: {
          student_id: rec.student_id,
          subject_id: rec.subject_id,
          exam_id: rec.exam_id || undefined,
          ...(rec.class_id ? { class_id: rec.class_id } : {}),
        },
      });

      if (existing) {
        await db.mark.update({
          where: { mark_id: existing.mark_id },
          data: { mark_obtained: rec.mark_obtained ?? 0, comment: rec.comment || "" },
        });
        count++;
      } else {
        await db.mark.create({
          data: {
            student_id: rec.student_id,
            subject_id: rec.subject_id,
            class_id: rec.class_id || null,
            section_id: rec.section_id || null,
            exam_id: rec.exam_id || null,
            mark_obtained: rec.mark_obtained ?? 0,
            comment: rec.comment || "",
          },
        });
        count++;
      }
    }

    return NextResponse.json({ count });
  } catch (err) {
    console.error("Save marks error:", err);
    return NextResponse.json({ error: "Failed to save marks" }, { status: 500 });
  }
}
