import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { verifyStudent, studentError } from "@/lib/verify-student";

export async function GET(req: NextRequest) {
  const auth = await verifyStudent();
  if (auth.error) return studentError(auth.error);

  try {
    const { searchParams } = new URL(req.url);
    const sectionId = searchParams.get("section_id");

    if (!sectionId) {
      // Auto-detect section from enrollment
      const enroll = await db.enroll.findFirst({
        where: { student_id: auth.studentId, mute: 0 },
        include: { section: { select: { section_id: true, name: true } } },
        orderBy: { enroll_id: "desc" },
      });

      if (!enroll) {
        return NextResponse.json({ routines: [], sections: [] });
      }

      const routines = await db.class_routine.findMany({
        where: { section_id: enroll.section_id },
        include: {
          section: { select: { section_id: true, name: true } },
          subject: { select: { subject_id: true, name: true } },
        },
        orderBy: [{ day: "asc" }, { time_start: "asc" }],
      });

      return NextResponse.json({
        routines,
        section: enroll.section,
      });
    }

    const routines = await db.class_routine.findMany({
      where: { section_id: parseInt(sectionId) },
      include: {
        section: { select: { section_id: true, name: true } },
        subject: { select: { subject_id: true, name: true } },
      },
      orderBy: [{ day: "asc" }, { time_start: "asc" }],
    });

    return NextResponse.json({ routines });
  } catch (error) {
    console.error("Student routine error:", error);
    return NextResponse.json({ error: "Failed to load routine" }, { status: 500 });
  }
}
