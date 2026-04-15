import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/teacher-auth";

// GET /api/teacher/payments — fee payments for teacher's assigned classes
export async function GET(request: NextRequest) {
  const { error, teacherId } = await requireTeacher();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("start_date") || "";
    const dateTo = searchParams.get("end_date") || "";
    const feeType = searchParams.get("payment_type") || "";

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
      return NextResponse.json({ payments: [], summary: { total: 0, count: 0 } });
    }

    // Build payment query
    const where: Record<string, unknown> = {
      student: {
        invoices: {
          some: {
            class_id: { in: subjectClassIds },
          },
        },
      },
    };

    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) (where.timestamp as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (where.timestamp as Record<string, unknown>).lte = new Date(dateTo + "T23:59:59");
    }
    if (feeType) {
      where.payment_type = feeType;
    }

    const payments = await db.payment.findMany({
      where,
      include: {
        student: {
          select: {
            student_id: true,
            student_code: true,
            name: true,
            invoices: {
              select: { class_id: true, class_name: true },
              take: 1,
              orderBy: { invoice_id: "desc" },
            },
          },
        },
      },
      orderBy: { timestamp: "desc" },
      take: 200,
    });

    const formatted = payments.map((p) => ({
      payment_id: p.payment_id,
      student_id: p.student_id,
      student_name: p.student?.name || "",
      student_code: p.student?.student_code || "",
      class_name: p.student?.invoices[0]?.class_name || "",
      title: p.title,
      amount: p.amount,
      payment_type: p.payment_type,
      payment_method: p.payment_method,
      date: p.timestamp,
    }));

    const totalAmount = payments.reduce((s, p) => s + (p.amount || 0), 0);

    // Get fee types for filter
    const feeTypes = await db.payment.findMany({
      where: {
        payment_type: { not: "" },
        student: {
          invoices: {
            some: { class_id: { in: subjectClassIds } },
          },
        },
      },
      select: { payment_type: true },
      distinct: ["payment_type"],
    });

    return NextResponse.json({
      payments: formatted,
      summary: { total: totalAmount, count: payments.length },
      fee_types: feeTypes.map((f) => f.payment_type),
    });
  } catch (err) {
    console.error("Teacher payments error:", err);
    return NextResponse.json({ error: "Failed to load payments" }, { status: 500 });
  }
}
