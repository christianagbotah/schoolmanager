import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/teacher-auth";
import { getSettings } from "@/lib/settings";

// GET /api/teacher/students — students in teacher's classes
export async function GET(request: NextRequest) {
  const { error, teacherId } = await requireTeacher();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("class_id");
    const sectionId = searchParams.get("section_id");
    const search = searchParams.get("search") || "";

    const settings = await getSettings();
    const runningYear = settings.running_year || "";
    const runningTerm = settings.running_term || "";

    // Determine class IDs this teacher can access
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

    if (teacherClassIds.length === 0) {
      return NextResponse.json({ students: [], classes: [] });
    }

    const where: Record<string, unknown> = {
      class_id: { in: teacherClassIds },
      year: runningYear,
      term: runningTerm,
      mute: 0,
    };

    if (classId) where.class_id = parseInt(classId);
    if (sectionId) where.section_id = parseInt(sectionId);

    if (search) {
      where.OR = [
        { student: { name: { contains: search } } },
        { student: { student_code: { contains: search } } },
      ];
    }

    const enrollments = await db.enroll.findMany({
      where,
      include: {
        student: {
          select: {
            student_id: true, student_code: true, name: true,
            first_name: true, last_name: true, sex: true,
            email: true, phone: true, address: true, active_status: true,
          },
        },
        class: {
          select: { class_id: true, name: true, name_numeric: true },
        },
        section: {
          select: { section_id: true, name: true },
        },
      },
      orderBy: { roll: "asc" },
      take: 200,
    });

    const students = enrollments.map((e) => ({
      ...e.student,
      class_id: e.class_id,
      section_id: e.section_id,
      class_name: e.class?.name,
      section_name: e.section?.name,
      roll: e.roll,
      enrolls: enrollments.filter((x) => x.student_id === e.student_id).map((x) => ({
        class: x.class,
        section: x.section,
      })),
    }));

    return NextResponse.json({ students, total: students.length });
  } catch (err) {
    console.error("Teacher students error:", err);
    return NextResponse.json({ error: "Failed to load students" }, { status: 500 });
  }
}
