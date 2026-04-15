import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/teacher-auth";

// GET /api/teacher/attendance — teacher's attendance data
export async function GET(request: NextRequest) {
  const { error, teacherId } = await requireTeacher();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("class_id");
    const sectionId = searchParams.get("section_id");
    const date = searchParams.get("date");

    if (!classId || !sectionId) {
      return NextResponse.json({ records: [], stats: {} });
    }

    // Verify teacher has access to this class
    const teacherSubject = await db.subject.findFirst({
      where: { teacher_id: teacherId, class_id: parseInt(classId) },
    });
    const teacherClass = await db.school_class.findFirst({
      where: { teacher_id: teacherId, class_id: parseInt(classId) },
    });

    if (!teacherSubject && !teacherClass) {
      return NextResponse.json({ records: [], stats: {} });
    }

    const records = await db.attendance.findMany({
      where: {
        class_id: parseInt(classId),
        section_id: parseInt(sectionId),
        ...(date ? { date } : {}),
      },
      include: {
        student: {
          select: { student_id: true, name: true, student_code: true },
        },
      },
      orderBy: { attendance_id: "asc" },
    });

    // Stats
    const presentCount = records.filter((r) => r.status === "present" || r.status === "1").length;
    const absentCount = records.filter((r) => r.status === "absent" || r.status === "2").length;
    const lateCount = records.filter((r) => r.status === "late" || r.status === "3").length;

    return NextResponse.json({
      records,
      stats: { total: records.length, present: presentCount, absent: absentCount, late: lateCount },
    });
  } catch (err) {
    console.error("Teacher attendance error:", err);
    return NextResponse.json({ error: "Failed to load attendance" }, { status: 500 });
  }
}

// POST /api/teacher/attendance — save attendance
export async function POST(request: NextRequest) {
  const { error, teacherId } = await requireTeacher();
  if (error) return error;

  try {
    const body = await request.json();
    const { class_id, section_id, date, records } = body;

    if (!class_id || !section_id || !date || !Array.isArray(records)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify teacher has access
    const teacherSubject = await db.subject.findFirst({
      where: { teacher_id: teacherId, class_id },
    });
    const teacherClass = await db.school_class.findFirst({
      where: { teacher_id: teacherId, class_id },
    });

    if (!teacherSubject && !teacherClass) {
      return NextResponse.json({ error: "Not authorized for this class" }, { status: 403 });
    }

    let count = 0;
    for (const rec of records) {
      const existing = await db.attendance.findFirst({
        where: {
          student_id: rec.student_id,
          class_id,
          section_id,
          date,
        },
      });

      if (existing) {
        await db.attendance.update({
          where: { attendance_id: existing.attendance_id },
          data: { status: rec.status },
        });
      } else {
        await db.attendance.create({
          data: {
            student_id: rec.student_id,
            class_id,
            section_id,
            date,
            status: rec.status,
            marked_by: "teacher",
          },
        });
      }
      count++;
    }

    return NextResponse.json({ count });
  } catch (err) {
    console.error("Save attendance error:", err);
    return NextResponse.json({ error: "Failed to save attendance" }, { status: 500 });
  }
}
