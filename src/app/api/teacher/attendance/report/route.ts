import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/teacher-auth";

// GET /api/teacher/attendance/report — attendance report for teacher's classes
export async function GET(request: NextRequest) {
  const { error, teacherId } = await requireTeacher();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("class_id");
    const sectionId = searchParams.get("section_id");
    const dateFrom = searchParams.get("start_date") || "";
    const dateTo = searchParams.get("end_date") || "";

    // Get teacher's accessible class IDs
    const teacherSubjects = await db.subject.findMany({
      where: { teacher_id: teacherId },
      select: { class_id: true },
    });
    const subjectClassIds = [...new Set(teacherSubjects.map((s) => s.class_id).filter(Boolean))];

    const classTeacherClasses = await db.school_class.findMany({
      where: { teacher_id: teacherId },
      select: { class_id: true },
    });
    for (const c of classTeacherClasses) {
      subjectClassIds.push(c.class_id);
    }

    if (subjectClassIds.length === 0) {
      return NextResponse.json({
        status: "success",
        data: { stats: {}, students: [], weekly_trend: [] },
      });
    }

    // Build attendance query
    const where: Record<string, unknown> = {
      class_id: { in: subjectClassIds },
    };

    if (classId && classId !== "all") {
      where.class_id = parseInt(classId);
    }
    if (sectionId && sectionId !== "all") {
      where.section_id = parseInt(sectionId);
    }
    if (dateFrom && dateTo) {
      where.date = { gte: dateFrom, lte: dateTo };
    } else if (dateFrom) {
      where.date = { gte: dateFrom };
    } else if (dateTo) {
      where.date = { lte: dateTo };
    }

    const records = await db.attendance.findMany({
      where,
      include: {
        student: {
          select: { student_id: true, name: true, student_code: true },
        },
      },
      orderBy: { date: "asc" },
    });

    // Compute per-student summary
    const studentMap = new Map<number, {
      student_id: number;
      student_code: string;
      name: string;
      present: number;
      absent: number;
      late: number;
      sick_home: number;
      sick_clinic: number;
      total: number;
    }>();

    for (const r of records) {
      const sid = r.student_id;
      if (!studentMap.has(sid)) {
        studentMap.set(sid, {
          student_id: sid,
          student_code: r.student?.student_code || "",
          name: r.student?.name || "",
          present: 0,
          absent: 0,
          late: 0,
          sick_home: 0,
          sick_clinic: 0,
          total: 0,
        });
      }
      const entry = studentMap.get(sid)!;
      entry.total++;
      switch (r.status) {
        case "present":
        case "1":
          entry.present++;
          break;
        case "absent":
        case "2":
          entry.absent++;
          break;
        case "late":
        case "3":
          entry.late++;
          break;
        case "sick-home":
        case "4":
          entry.sick_home++;
          break;
        case "sick-clinic":
        case "5":
          entry.sick_clinic++;
          break;
      }
    }

    const students = Array.from(studentMap.values()).map((s) => ({
      ...s,
      percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
    }));

    students.sort((a, b) => b.percentage - a.percentage);

    // Stats
    const totalPresent = students.reduce((s, st) => s + st.present, 0);
    const totalAbsent = students.reduce((s, st) => s + st.absent, 0);
    const totalLate = students.reduce((s, st) => s + st.late, 0);
    const totalSickHome = students.reduce((s, st) => s + st.sick_home, 0);
    const totalSickClinic = students.reduce((s, st) => s + st.sick_clinic, 0);
    const totalAll = totalPresent + totalAbsent + totalLate + totalSickHome + totalSickClinic;

    return NextResponse.json({
      status: "success",
      data: {
        stats: {
          total_days: records.length > 0
            ? new Set(records.map((r) => r.date)).size
            : 0,
          total_present: totalPresent,
          total_absent: totalAbsent,
          total_late: totalLate,
          total_sick_home: totalSickHome,
          total_sick_clinic: totalSickClinic,
          attendance_rate: totalAll > 0 ? Math.round((totalPresent / totalAll) * 100) : 0,
          absent_rate: totalAll > 0 ? Math.round(((totalAbsent + totalSickHome + totalSickClinic) / totalAll) * 100) : 0,
        },
        students,
        weekly_trend: [],
      },
    });
  } catch (err) {
    console.error("Teacher attendance report error:", err);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
