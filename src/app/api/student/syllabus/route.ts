import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { verifyStudent, studentError } from "@/lib/verify-student";

export async function GET(req: NextRequest) {
  const auth = await verifyStudent();
  if (auth.error) return studentError(auth.error);

  try {
    const studentId = auth.studentId;

    // Get current enrollment
    const enrollment = await db.enroll.findFirst({
      where: { student_id: studentId, mute: 0 },
      include: {
        class: { select: { class_id: true, name: true, name_numeric: true } },
        section: { select: { section_id: true, name: true } },
      },
      orderBy: { enroll_id: "desc" },
    });

    if (!enrollment) {
      return NextResponse.json({ syllabi: [], subjects: [] });
    }

    // Get running year/term
    const [runningYear, runningTerm] = await Promise.all([
      db.settings.findFirst({ where: { type: "running_year" } }),
      db.settings.findFirst({ where: { type: "running_term" } }),
    ]);
    const year = runningYear?.description || enrollment.year;
    const term = runningTerm?.description || enrollment.term;

    // Get subjects for this class/section
    const subjects = await db.subject.findMany({
      where: {
        class_id: enrollment.class_id,
        status: 1,
      },
      select: {
        subject_id: true,
        name: true,
        teacher: { select: { teacher_id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });

    const subjectIds = subjects.map((s) => s.subject_id);

    // Get syllabi for this class and its subjects
    const syllabi = subjectIds.length > 0
      ? await db.academic_syllabus.findMany({
          where: {
            class_id: enrollment.class_id,
            subject_id: { in: subjectIds },
          },
          select: {
            syllabus_id: true,
            academic_syllabus_code: true,
            title: true,
            description: true,
            file_name: true,
            file_path: true,
            upload_date: true,
            uploaded_by: true,
            subject_id: true,
            class_id: true,
            year: true,
            term: true,
            subject: { select: { name: true } },
            class: { select: { name: true, name_numeric: true } },
          },
          orderBy: { syllabus_id: "desc" },
        })
      : [];

    return NextResponse.json({
      syllabi,
      subjects,
      enrollment: {
        class_id: enrollment.class_id,
        class_name: enrollment.class.name,
        class_numeric: enrollment.class.name_numeric,
        section_name: enrollment.section.name,
        year,
        term,
      },
    });
  } catch (error) {
    console.error("Student syllabus error:", error);
    return NextResponse.json({ error: "Failed to load syllabus" }, { status: 500 });
  }
}
