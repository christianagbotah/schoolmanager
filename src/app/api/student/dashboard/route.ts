import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { verifyStudent, studentError } from "@/lib/verify-student";

export async function GET(req: NextRequest) {
  const auth = await verifyStudent();
  if (auth.error) return studentError(auth.error);

  try {
    const studentId = auth.studentId;

    // Fetch student profile with enrollment
    const student = await db.student.findUnique({
      where: { student_id: studentId },
      select: {
        student_id: true,
        student_code: true,
        name: true,
        first_name: true,
        last_name: true,
        sex: true,
        birthday: true,
        email: true,
        phone: true,
        address: true,
        admission_date: true,
        username: true,
        active_status: true,
        parent: {
          select: { parent_id: true, name: true, phone: true, email: true },
        },
        enrolls: {
          include: {
            class: { select: { class_id: true, name: true, name_numeric: true, category: true } },
            section: { select: { section_id: true, name: true } },
          },
          orderBy: { enroll_id: "desc" },
        },
      },
    });

    if (!student) return studentError("Student not found", 404);

    const enroll = student.enrolls.find((e) => e.mute === 0) || student.enrolls[0];

    // Fetch recent marks (last 10)
    const recentMarks = await db.mark.findMany({
      where: { student_id: studentId },
      include: {
        subject: { select: { subject_id: true, name: true } },
        exam: { select: { exam_id: true, name: true } },
      },
      orderBy: { mark_id: "desc" },
      take: 10,
    });

    // Fetch attendance summary
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const attendanceRecords = await db.attendance.findMany({
      where: { student_id: studentId },
      select: { status: true },
    });

    const presentCount = attendanceRecords.filter(
      (r) => r.status === "present" || r.status === "1" || r.status === "late" || r.status === "3"
    ).length;
    const totalAtt = attendanceRecords.length;
    const attPct = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : 0;

    // Fetch invoices summary
    const invoices = await db.invoice.findMany({
      where: { student_id: studentId, can_delete: { not: "trash" } },
      orderBy: { creation_timestamp: "desc" },
      take: 10,
    });

    const totalBilled = invoices.reduce((s, i) => s + (i.amount || 0), 0);
    const totalPaid = invoices.reduce((s, i) => s + (i.amount_paid || 0), 0);
    const feeBalance = totalBilled - totalPaid;

    // Fetch today's routine
    let todayRoutines: {
      class_routine_id: number;
      time_start: string;
      time_end: string;
      day: string;
      room: string;
      section_id: number;
      section: { section_id: number; name: string };
    }[] = [];

    if (enroll) {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const todayName = days[now.getDay()];
      todayRoutines = await db.class_routine.findMany({
        where: { section_id: enroll.section_id, day: todayName },
        include: { section: { select: { section_id: true, name: true } } },
        orderBy: { time_start: "asc" },
      });
    }

    // Fetch recent notices
    const notices = await db.notice.findMany({
      where: { status: 1 },
      orderBy: { timestamp: "desc" },
      take: 5,
      select: { id: true, title: true, notice: true, timestamp: true, create_timestamp: true },
    });

    return NextResponse.json({
      student: {
        student_id: student.student_id,
        student_code: student.student_code,
        name: student.name,
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email,
        phone: student.phone,
        sex: student.sex,
        birthday: student.birthday,
        address: student.address,
        admission_date: student.admission_date,
        username: student.username,
        active_status: student.active_status,
      },
      parent: student.parent || null,
      enroll: enroll
        ? {
            class_id: enroll.class_id,
            section_id: enroll.section_id,
            year: enroll.year,
            term: enroll.term,
            class_name: enroll.class.name,
            class_numeric: enroll.class.name_numeric,
            section_name: enroll.section.name,
            class_category: enroll.class.category,
          }
        : null,
      recentMarks,
      attendance: {
        present: presentCount,
        total: totalAtt,
        percentage: attPct,
      },
      invoices: invoices.map((inv) => ({
        invoice_id: inv.invoice_id,
        invoice_code: inv.invoice_code,
        title: inv.title,
        amount: inv.amount,
        amount_paid: inv.amount_paid,
        due: inv.due,
        status: inv.status,
        creation_timestamp: inv.creation_timestamp,
      })),
      feeBalance,
      todayRoutines,
      notices,
    });
  } catch (error) {
    console.error("Student dashboard error:", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
