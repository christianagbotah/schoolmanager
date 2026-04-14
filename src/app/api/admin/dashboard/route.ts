import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const now = new Date();
    const currentYear = String(now.getFullYear());
    const currentMonth = now.getMonth();

    // Determine current term based on month
    let currentTerm = "Term 3";
    if (currentMonth >= 0 && currentMonth <= 3) currentTerm = "Term 1";
    else if (currentMonth >= 4 && currentMonth <= 7) currentTerm = "Term 2";

    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      activeParents,
      attendanceToday,
      revenueThisTerm,
      outstandingFees,
      totalInvoiceAmount,
      totalPaid,
      recentPayments,
      classDistribution,
      genderData,
      attendanceLast7Days,
    ] = await Promise.all([
      // 1. Total active students
      db.student.count({ where: { active_status: 1 } }),

      // 2. Total active teachers
      db.teacher.count({ where: { active_status: 1 } }),

      // 3. Total classes
      db.school_class.count(),

      // 4. Active parents (parents with active students)
      db.parent.count({ where: { active_status: 1 } }),

      // 5. Attendance today - present students
      db.attendance.count({
        where: {
          status: "present",
          timestamp: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          },
        },
      }),

      // 6. Revenue this term
      db.payment.aggregate({
        where: { year: currentYear, term: currentTerm },
        _sum: { amount: true },
      }),

      // 7. Outstanding fees
      db.invoice.aggregate({
        where: { status: { not: "paid" } },
        _sum: { due: true },
      }),

      // 8. Total invoice amounts for collection rate
      db.invoice.aggregate({
        where: { year: currentYear },
        _sum: { amount: true, amount_paid: true },
      }),

      // 9. Total paid (same as above, more convenient)
      db.invoice.aggregate({
        where: { year: currentYear },
        _sum: { amount_paid: true },
      }),

      // 10. Recent payments
      db.payment.findMany({
        take: 10,
        orderBy: { timestamp: "desc" },
        include: {
          student: {
            select: { name: true, first_name: true, last_name: true },
          },
        },
      }),

      // 11. Student distribution by class (top 10 classes)
      db.school_class.findMany({
        take: 10,
        orderBy: { name_numeric: "asc" },
        select: {
          name: true,
          _count: { select: { enrolls: true } },
        },
      }),

      // 12. Gender distribution
      db.student.groupBy({
        by: ["sex"],
        where: { active_status: 1 },
        _count: { sex: true },
      }),

      // 13. Attendance for the last 7 days
      db.attendance.groupBy({
        by: ["timestamp"],
        where: {
          timestamp: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6),
          },
          status: "present",
        },
        _count: { attendance_id: true },
      }),
    ]);

    // Process class distribution
    const classDistributionData = classDistribution.map((c) => ({
      name: c.name.length > 15 ? c.name.substring(0, 15) + "…" : c.name,
      students: c._count.enrolls,
    }));

    // Process gender distribution
    const genderMap: Record<string, number> = { Male: 0, Female: 0 };
    genderData.forEach((g) => {
      if (g.sex === "Male" || g.sex === "male" || g.sex === "M" || g.sex === "m") {
        genderMap.Male = g._count.sex;
      } else if (g.sex === "Female" || g.sex === "female" || g.sex === "F" || g.sex === "f") {
        genderMap.Female = g._count.sex;
      }
    });

    // Process attendance last 7 days
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const attendanceTrend = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + i);
      const dateStr = date.toISOString().split("T")[0];

      const dayRecord = attendanceLast7Days.find((r) => {
        if (!r.timestamp) return false;
        return r.timestamp.toISOString().split("T")[0] === dateStr;
      });

      return {
        day: dayNames[date.getDay()],
        date: dateStr,
        present: dayRecord ? dayRecord._count.attendance_id : 0,
      };
    });

    // Financial stats
    const totalRevenue = revenueThisTerm._sum.amount || 0;
    const totalOutstanding = outstandingFees._sum.due || 0;
    const totalInvoiced = totalInvoiceAmount._sum.amount || 0;
    const totalPaidAmount = totalPaid._sum.amount_paid || 0;
    const collectionRate = totalInvoiced > 0
      ? Math.round((totalPaidAmount / totalInvoiced) * 100)
      : 0;

    // Determine collection rate label
    let collectionLabel = "Needs Attention";
    let collectionColor = "text-red-600 bg-red-50 border-red-200";
    if (collectionRate >= 80) {
      collectionLabel = "Excellent";
      collectionColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
    } else if (collectionRate >= 60) {
      collectionLabel = "Good";
      collectionColor = "text-amber-700 bg-amber-50 border-amber-200";
    }

    return NextResponse.json({
      stats: {
        totalStudents,
        totalTeachers,
        totalClasses,
        activeParents,
        attendanceToday,
      },
      financial: {
        totalRevenue,
        collectionRate,
        collectionLabel,
        collectionColor,
        totalOutstanding,
      },
      charts: {
        classDistribution: classDistributionData,
        genderDistribution: [
          { name: "Male", value: genderMap.Male, fill: "var(--color-male)" },
          { name: "Female", value: genderMap.Female, fill: "var(--color-female)" },
        ],
        attendanceTrend,
      },
      recentPayments: recentPayments.map((p) => ({
        id: p.payment_id,
        studentName:
          p.student.name ||
          `${p.student.first_name} ${p.student.last_name}`.trim(),
        amount: p.amount,
        method: p.payment_method || "N/A",
        date: p.timestamp?.toISOString() || null,
        status: p.approval_status || "approved",
        invoiceCode: p.invoice_code || "",
      })),
      academicTerm: {
        year: currentYear,
        term: currentTerm,
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
