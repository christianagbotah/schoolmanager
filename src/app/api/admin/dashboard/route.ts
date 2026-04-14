import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Get current date info
    const now = new Date();
    const currentYear = String(now.getFullYear());
    const currentMonth = now.getMonth(); // 0-indexed

    // Get current term (simplified: determine term based on month)
    // Term 1: Jan-Apr, Term 2: May-Aug, Term 3: Sep-Dec
    let currentTerm = "Term 3";
    if (currentMonth >= 0 && currentMonth <= 3) currentTerm = "Term 1";
    else if (currentMonth >= 4 && currentMonth <= 7) currentTerm = "Term 2";

    // Fetch all stats in parallel
    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      revenueThisTerm,
      outstandingFees,
      attendanceToday,
      recentPayments,
      monthlyRevenue,
      feeOverview,
    ] = await Promise.all([
      // 1. Total active students
      db.student.count({
        where: { active_status: 1 },
      }),

      // 2. Total active teachers
      db.teacher.count({
        where: { active_status: 1 },
      }),

      // 3. Total classes
      db.school_class.count(),

      // 4. Revenue this term (sum of payments)
      db.payment.aggregate({
        where: {
          year: currentYear,
          term: currentTerm,
        },
        _sum: { amount: true },
      }),

      // 5. Outstanding fees (invoices not fully paid)
      db.invoice.aggregate({
        where: {
          status: { not: "paid" },
        },
        _sum: { due: true },
      }),

      // 6. Attendance today - present students
      db.attendance.count({
        where: {
          status: "present",
          timestamp: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          },
        },
      }),

      // 7. Recent payments (last 10)
      db.payment.findMany({
        take: 10,
        orderBy: { timestamp: "desc" },
        include: {
          student: {
            select: { name: true, first_name: true, last_name: true },
          },
        },
      }),

      // 8. Monthly revenue (last 6 months)
      db.payment.findMany({
        where: {
          timestamp: {
            gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
          },
        },
        select: {
          amount: true,
          timestamp: true,
          year: true,
        },
      }),

      // 9. Fee collection overview
      db.invoice.aggregate({
        where: { year: currentYear },
        _sum: { amount: true, amount_paid: true, due: true },
        _count: true,
      }),
    ]);

    // Process monthly revenue data
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const monthlyRevenueData = Array.from({ length: 6 }, (_, i) => {
      const targetMonth = (currentMonth - 5 + i + 12) % 12;
      const targetYear =
        currentMonth - 5 + i < 0
          ? currentYear - 1
          : currentYear;

      const monthPayments = monthlyRevenue.filter((p) => {
        if (!p.timestamp) return false;
        const pMonth = p.timestamp.getMonth();
        const pYear = p.timestamp.getFullYear();
        return pMonth === targetMonth && pYear === targetYear;
      });

      const total = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      return {
        month: monthNames[targetMonth],
        revenue: Math.round(total * 100) / 100,
      };
    });

    // Process fee overview
    const totalInvoiceAmount = feeOverview._sum.amount || 0;
    const totalPaid = feeOverview._sum.amount_paid || 0;
    const totalDue = feeOverview._sum.due || 0;

    // Determine overdue: invoices that are overdue (past due date and not paid)
    const overdueAmount = await db.invoice.aggregate({
      where: {
        status: { not: "paid" },
        payment_timestamp: { lt: now },
      },
      _sum: { due: true },
    });

    const feeOverviewData = [
      { name: "paid", value: Math.round(totalPaid * 100) / 100, fill: "var(--color-paid)" },
      { name: "outstanding", value: Math.round((totalDue - (overdueAmount._sum.due || 0)) * 100) / 100, fill: "var(--color-outstanding)" },
      { name: "overdue", value: Math.round((overdueAmount._sum.due || 0) * 100) / 100, fill: "var(--color-overdue)" },
    ];

    return NextResponse.json({
      stats: {
        totalStudents,
        totalTeachers,
        totalClasses,
        revenueThisTerm: revenueThisTerm._sum.amount || 0,
        outstandingFees: outstandingFees._sum.due || 0,
        attendanceToday,
      },
      charts: {
        monthlyRevenue: monthlyRevenueData,
        feeOverview: feeOverviewData,
      },
      recentPayments: recentPayments.map((p) => ({
        id: p.payment_id,
        studentName: p.student.name || `${p.student.first_name} ${p.student.last_name}`.trim(),
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
