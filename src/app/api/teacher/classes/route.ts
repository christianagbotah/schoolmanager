import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireTeacher } from "@/lib/teacher-auth";

// GET /api/teacher/classes — teacher's assigned classes with student counts
export async function GET() {
  const { error, teacherId } = await requireTeacher();
  if (error) return error;

  try {
    // Classes where teacher is the class teacher
    const classTeacherClasses = await db.school_class.findMany({
      where: { teacher_id: teacherId },
      include: {
        sections: {
          select: { section_id: true, name: true },
          orderBy: { section_id: "asc" },
        },
        subjects: {
          select: { subject_id: true, name: true },
        },
        _count: {
          select: { enrolls: true },
        },
      },
      orderBy: { name_numeric: "asc" },
    });

    // Classes where teacher teaches a subject
    const teacherSubjects = await db.subject.findMany({
      where: { teacher_id: teacherId },
      select: { class_id: true },
    });
    const subjectClassIds = [...new Set(teacherSubjects.map((s) => s.class_id).filter(Boolean))];

    // Get those classes too
    const subjectClasses = subjectClassIds.length > 0
      ? await db.school_class.findMany({
          where: { class_id: { in: subjectClassIds } },
          include: {
            sections: {
              select: { section_id: true, name: true },
              orderBy: { section_id: "asc" },
            },
            subjects: {
              where: { teacher_id },
              select: { subject_id: true, name: true },
            },
            _count: {
              select: { enrolls: true },
            },
          },
        })
      : [];

    // Merge: avoid duplicates
    const existingIds = new Set(classTeacherClasses.map((c) => c.class_id));
    const merged = [...classTeacherClasses];
    for (const c of subjectClasses) {
      if (!existingIds.has(c.class_id)) {
        merged.push(c);
        existingIds.add(c.class_id);
      }
    }

    // Mark which are class teacher vs subject teacher
    const result = merged.map((c) => ({
      ...c,
      is_class_teacher: c.teacher_id === teacherId,
      sections: c.sections,
      subjects: c.subjects,
      student_count: c._count?.enrolls || 0,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("Teacher classes error:", err);
    return NextResponse.json({ error: "Failed to load classes" }, { status: 500 });
  }
}
