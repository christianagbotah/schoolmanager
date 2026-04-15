import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireTeacher } from "@/lib/teacher-auth";
import { getSettings } from "@/lib/settings";

// GET /api/teacher/dashboard — teacher dashboard stats
export async function GET() {
  const { error, teacherId } = await requireTeacher();
  if (error) return error;

  try {
    const settings = await getSettings();
    const runningYear = settings.running_year || "";
    const runningTerm = settings.running_term || "";

    // Get classes where this teacher is the class teacher
    const classes = await db.school_class.findMany({
      where: { teacher_id: teacherId },
      include: {
        sections: {
          select: { section_id: true, name: true },
        },
      },
    });

    const classIds = classes.map((c) => c.class_id);

    // Get subjects taught by this teacher
    const subjects = await db.subject.findMany({
      where: {
        teacher_id: teacherId,
        year: runningYear,
        term: parseInt(runningTerm) || undefined,
      },
      include: {
        class: {
          select: { class_id: true, name: true, name_numeric: true },
        },
      },
    });

    // Get today's attendance count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    const todayAttendance = await db.attendance.findMany({
      where: {
        class_id: { in: classIds },
        date: todayStr,
        marked_by: "teacher",
      },
      select: { attendance_id: true, status: true, class_id: true },
    });

    const presentCount = todayAttendance.filter(
      (a) => a.status === "present" || a.status === "1"
    ).length;
    const absentCount = todayAttendance.filter(
      (a) => a.status === "absent" || a.status === "2"
    ).length;

    // Total students enrolled in teacher's classes
    const enrollments = await db.enroll.findMany({
      where: {
        class_id: { in: classIds },
        year: runningYear,
        term: runningTerm,
        mute: 0,
      },
    });

    // Recent notices
    const notices = await db.notice.findMany({
      where: { status: 1 },
      orderBy: { create_timestamp: "desc" },
      take: 5,
      select: { id: true, title: true, timestamp: true, create_timestamp: true },
    });

    // Unread messages count
    const unreadMessages = await db.message.count({
      where: {
        sender_type: { not: "teacher" },
        message_thread: {
          reciever: { contains: `teacher-${teacherId}` },
        },
      },
    });

    return NextResponse.json({
      teacher: {
        name: (await requireTeacher()).teacher?.name || "",
      },
      stats: {
        totalClasses: classIds.length,
        totalSubjects: subjects.length,
        totalStudents: enrollments.length,
        todayPresent: presentCount,
        todayAbsent: absentCount,
        unreadMessages,
      },
      classes,
      subjects,
      recentNotices: notices,
    });
  } catch (err) {
    console.error("Teacher dashboard error:", err);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
