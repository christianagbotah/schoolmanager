import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/teacher-auth";

// GET /api/teacher/routine — teacher's class routines
export async function GET(request: NextRequest) {
  const { error, teacherId } = await requireTeacher();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get("section_id");

    if (!sectionId) {
      return NextResponse.json({ routines: [] });
    }

    // Get section's class to verify access
    const section = await db.section.findUnique({
      where: { section_id: parseInt(sectionId) },
      include: {
        class: { select: { class_id: true, teacher_id: true, name: true } },
      },
    });

    if (!section) {
      return NextResponse.json({ routines: [] });
    }

    // Verify teacher has access: either class teacher or teaches a subject in this section
    const isClassTeacher = section.class?.teacher_id === teacherId;
    const teachesInSection = await db.subject.findFirst({
      where: { teacher_id: teacherId, section_id: parseInt(sectionId) },
    });

    if (!isClassTeacher && !teachesInSection) {
      return NextResponse.json({ routines: [] });
    }

    const routines = await db.class_routine.findMany({
      where: { section_id: parseInt(sectionId) },
      include: {
        subject: {
          select: { subject_id: true, name: true, teacher_id: true },
        },
      },
      orderBy: [
        { day: "asc" },
        { time_start: "asc" },
      ],
    });

    // Mark which routines are taught by this teacher
    const result = routines.map((r) => ({
      ...r,
      is_mine: r.subject?.teacher_id === teacherId,
    }));

    return NextResponse.json({ routines: result });
  } catch (err) {
    console.error("Teacher routine error:", err);
    return NextResponse.json({ error: "Failed to load routine" }, { status: 500 });
  }
}
