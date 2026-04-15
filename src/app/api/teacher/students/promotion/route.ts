import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/teacher-auth";

// GET /api/teacher/students/promotion — get promotion candidates
export async function GET(request: NextRequest) {
  const { error, teacherId } = await requireTeacher();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const fromClassId = parseInt(searchParams.get("fromClassId") || "0");
    const toClassId = parseInt(searchParams.get("toClassId") || "0");
    const runningYear = searchParams.get("runningYear") || "";
    const promotionYear = searchParams.get("promotionYear") || "";

    if (!fromClassId || !toClassId) {
      return NextResponse.json({ error: "fromClassId and toClassId are required" }, { status: 400 });
    }

    // Verify teacher has access to this class
    const teacherSubject = await db.subject.findFirst({
      where: { teacher_id: teacherId, class_id: fromClassId },
    });
    const teacherClass = await db.school_class.findFirst({
      where: { teacher_id: teacherId, class_id: fromClassId },
    });

    if (!teacherSubject && !teacherClass) {
      return NextResponse.json({ error: "Not authorized for this class" }, { status: 403 });
    }

    // Get from class info
    const fromClass = await db.school_class.findUnique({
      where: { class_id: fromClassId },
      select: { class_id: true, name: true, name_numeric: true, category: true },
    });

    // Get to class info
    const toClass = await db.school_class.findUnique({
      where: { class_id: toClassId },
      select: { class_id: true, name: true, name_numeric: true, category: true },
    });

    // Get to class sections
    const toSections = await db.section.findMany({
      where: { class_id: toClassId },
      select: { section_id: true, name: true },
      orderBy: { section_id: "asc" },
    });

    // Get enrolled students in current year
    const enrollments = await db.enroll.findMany({
      where: {
        class_id: fromClassId,
        year: runningYear,
        mute: 0,
      },
      include: {
        student: {
          select: { student_id: true, student_code: true, name: true, sex: true },
        },
        section: {
          select: { section_id: true, name: true },
        },
      },
      orderBy: { roll: "asc" },
    });

    // Check if already enrolled in promotion year
    const students = [];
    let eligible = 0;
    let alreadyEnrolled = 0;

    for (const e of enrollments) {
      const existing = promotionYear
        ? await db.enroll.findFirst({
            where: {
              student_id: e.student_id,
              class_id: toClassId,
              year: promotionYear,
            },
          })
        : null;

      students.push({
        student_id: e.student.student_id,
        student_code: e.student.student_code,
        name: e.student.name,
        sex: e.student.sex,
        section_id: e.section_id,
        section_name: e.section.name,
        already_enrolled: !!existing,
        avg_marks: 0,
      });

      if (existing) {
        alreadyEnrolled++;
      } else {
        eligible++;
      }
    }

    return NextResponse.json({
      fromClass,
      toClass,
      toSections,
      students,
      total: students.length,
      alreadyEnrolled,
      eligible,
    });
  } catch (err) {
    console.error("Teacher promotion GET error:", err);
    return NextResponse.json({ error: "Failed to load promotion data" }, { status: 500 });
  }
}

// POST /api/teacher/students/promotion — promote students
export async function POST(request: NextRequest) {
  const { error, teacherId } = await requireTeacher();
  if (error) return error;

  try {
    const body = await request.json();
    const { fromClassId, runningYear, promotionYear, promotions } = body;

    if (!fromClassId || !Array.isArray(promotions)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify teacher is class teacher
    const teacherClass = await db.school_class.findFirst({
      where: { teacher_id: teacherId, class_id: fromClassId },
    });

    if (!teacherClass) {
      return NextResponse.json(
        { error: "Only class teachers can promote students" },
        { status: 403 }
      );
    }

    let count = 0;
    for (const promo of promotions) {
      const existing = promotionYear
        ? await db.enroll.findFirst({
            where: {
              student_id: promo.student_id,
              class_id: promo.target_class_id,
              year: promotionYear,
            },
          })
        : null;

      if (!existing) {
        await db.enroll.create({
          data: {
            student_id: promo.student_id,
            class_id: promo.target_class_id,
            section_id: promo.section_id || 0,
            year: promotionYear || runningYear,
            term: "1",
          },
        });
        count++;
      }
    }

    return NextResponse.json({
      message: `${count} student(s) promoted successfully`,
      count,
    });
  } catch (err) {
    console.error("Teacher promotion POST error:", err);
    return NextResponse.json({ error: "Failed to promote students" }, { status: 500 });
  }
}
