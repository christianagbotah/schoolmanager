import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/teacher-auth";

// GET /api/teacher/students/[id] — student profile for teacher
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, teacherId } = await requireTeacher();
  if (error) return error;

  try {
    const { id } = await params;
    const studentId = parseInt(id);
    if (!studentId) {
      return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
    }

    // Get teacher's class IDs
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

    // Verify student is in teacher's class
    const enrollment = await db.enroll.findFirst({
      where: {
        student_id: studentId,
        class_id: { in: teacherClassIds },
        mute: 0,
      },
      include: {
        class: { select: { class_id: true, name: true, name_numeric: true } },
        section: { select: { section_id: true, name: true } },
      },
      orderBy: { enroll_id: "desc" },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Student not in your classes" }, { status: 403 });
    }

    // Get student info
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
        blood_group: true,
        religion: true,
        nationality: true,
        admission_date: true,
        active_status: true,
        parent: {
          select: { name: true, phone: true, email: true, profession: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get attendance summary
    const attendanceRecords = await db.attendance.findMany({
      where: { student_id: studentId },
    });

    const presentCount = attendanceRecords.filter(
      (r) => r.status === "present" || r.status === "1"
    ).length;
    const absentCount = attendanceRecords.filter(
      (r) => r.status === "absent" || r.status === "2"
    ).length;
    const lateCount = attendanceRecords.filter(
      (r) => r.status === "late" || r.status === "3"
    ).length;
    const totalAttendance = attendanceRecords.length;
    const attendanceRate =
      totalAttendance > 0
        ? Math.round((presentCount / totalAttendance) * 100)
        : 0;

    // Get marks summary
    const marks = await db.mark.findMany({
      where: { student_id: studentId, class_id: enrollment.class_id },
      include: {
        subject: { select: { name: true } },
        exam: { select: { name: true } },
      },
      orderBy: { mark_id: "desc" },
      take: 50,
    });

    const marksSummary = marks.map((m) => ({
      subject_name: m.subject?.name || "",
      exam_name: m.exam?.name || "",
      mark_obtained: m.mark_obtained,
      comment: m.comment,
    }));

    // Get invoice/payment status
    const invoices = await db.invoice.findMany({
      where: {
        student_id: studentId,
        class_id: enrollment.class_id,
      },
      select: {
        invoice_id: true,
        title: true,
        amount: true,
        amount_paid: true,
        due: true,
        status: true,
        year: true,
        term: true,
      },
      take: 20,
      orderBy: { invoice_id: "desc" },
    });

    const totalFees = invoices.reduce((s, i) => s + (i.amount || 0), 0);
    const totalPaid = invoices.reduce((s, i) => s + (i.amount_paid || 0), 0);
    const totalDue = invoices.reduce((s, i) => s + (i.due || 0), 0);

    return NextResponse.json({
      student: {
        ...student,
        class_name: enrollment.class.name,
        section_name: enrollment.section.name,
        roll: enrollment.roll,
      },
      attendance: {
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        total: totalAttendance,
        rate: attendanceRate,
      },
      marks: marksSummary,
      fees: {
        invoices,
        total_fees: totalFees,
        total_paid: totalPaid,
        total_due: totalDue,
      },
    });
  } catch (err) {
    console.error("Teacher student detail error:", err);
    return NextResponse.json({ error: "Failed to load student details" }, { status: 500 });
  }
}
