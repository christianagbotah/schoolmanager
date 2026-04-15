import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Admin Dashboard API
 *
 * Faithfully mirrors the CI3 school management system's admin dashboard.
 * Accepts optional query params: ?year=2025&term=Term 1&date=2025-01-15
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filterYear = searchParams.get("year");
    const filterTerm = searchParams.get("term");
    const filterDate = searchParams.get("date");

    // ─────────────────────────────────────────────
    // 0. Resolve running year/term from settings
    // ─────────────────────────────────────────────
    const settingsRecords = await db.settings.findMany({
      where: {
        type: { in: ["running_year", "running_term"] },
      },
    });

    const runningYear =
      filterYear ||
      settingsRecords.find((s) => s.type === "running_year")?.description ||
      String(new Date().getFullYear());

    const runningTerm =
      filterTerm ||
      settingsRecords.find((s) => s.type === "running_term")?.description ||
      "Term 1";

    // ─────────────────────────────────────────────
    // Date setup for attendance queries
    // ─────────────────────────────────────────────
    const referenceDate = filterDate
      ? new Date(filterDate + "T00:00:00")
      : new Date();
    const startOfDay = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate(),
    );
    const endOfDay = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate(),
      23,
      59,
      59,
      999,
    );

    // 7-day window for attendance trend (relative to the reference date)
    const sevenDaysAgo = new Date(startOfDay);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    // ─────────────────────────────────────────────
    // 1. Fetch all data in parallel
    // ─────────────────────────────────────────────
    const [
      // --- Key Metrics ---
      studentEnrollmentGroups,
      activeTeachersCount,
      parentEnrollmentGroups,
      attendanceTodayCount,

      // --- Financial Overview ---
      revenueAggregate,
      billedAggregate,
      pendingPaymentGroups,

      // --- Financial Summary (super-admin) ---
      unpaidInvoicesAggregate,
      totalIncomeAggregate,
      totalExpenseAggregate,

      // --- Recent Payments ---
      recentPayments,

      // --- Chart Data ---
      enrollmentDetails,
      attendanceTrendRecords,
    ] = await Promise.all([
      // ── 1a. Total Students: distinct student_id from enroll where mute=0 ──
      db.enroll.groupBy({
        by: ["student_id"],
        where: { year: runningYear, term: runningTerm, mute: 0 },
      }),

      // ── 1b. Active Teachers: active_status=1 ──
      db.teacher.count({ where: { active_status: 1 } }),

      // ── 1c. Active Parents: parents linked to enrolled students ──
      db.enroll.groupBy({
        by: ["parent_id"],
        where: {
          year: runningYear,
          term: runningTerm,
          mute: 0,
          parent_id: { not: null },
        },
      }),

      // ── 1d. Attendance Today: present (1) or late (3) ──
      db.attendance.count({
        where: {
          timestamp: { gte: startOfDay, lte: endOfDay },
          status: { in: ["1", "3"] },
        },
      }),

      // ── 2a. Total Revenue (Term): income payments, not trashed ──
      db.payment.aggregate({
        _sum: { amount: true },
        where: {
          year: runningYear,
          term: runningTerm,
          payment_type: "income",
          can_delete: { not: "trash" },
        },
      }),

      // ── 2b. Total Billed (Term): invoice amounts, not muted/trashed ──
      db.invoice.aggregate({
        _sum: { amount: true },
        where: {
          year: runningYear,
          term: runningTerm,
          mute: 0,
          can_delete: { not: "trash" },
        },
      }),

      // ── 2c. Pending Payments: distinct students with unpaid invoices ──
      db.invoice.groupBy({
        by: ["student_id"],
        where: {
          status: "unpaid",
          year: runningYear,
          term: runningTerm,
        },
      }),

      // ── 4a. Financial Summary: Unpaid Invoices (due > 0) ──
      db.invoice.aggregate({
        _count: true,
        _sum: { due: true },
        where: {
          year: runningYear,
          term: runningTerm,
          due: { gt: 0 },
          mute: 0,
          can_delete: { not: "trash" },
        },
      }),

      // ── 4b. Financial Summary: Total Income ──
      db.payment.aggregate({
        _count: true,
        _sum: { amount: true },
        where: {
          payment_type: "income",
          can_delete: { not: "trash" },
        },
      }),

      // ── 4c. Financial Summary: Total Expenses ──
      db.payment.aggregate({
        _sum: { amount: true },
        where: {
          payment_type: "expense",
          can_delete: { not: "trash" },
        },
      }),

      // ── 5. Recent Payments: last 10 with student name ──
      db.payment.findMany({
        take: 10,
        orderBy: { timestamp: "desc" },
        include: {
          student: {
            select: { name: true, first_name: true, last_name: true },
          },
        },
      }),

      // ── 3a-c. Enrollment details for all chart computations ──
      // Single query replaces three separate chart queries:
      //   - Student Distribution by Class
      //   - Gender Distribution by Class
      //   - Residential Distribution by Class
      db.enroll.findMany({
        where: { year: runningYear, term: runningTerm, mute: 0 },
        select: {
          class_id: true,
          class: { select: { name: true } },
          student: { select: { sex: true } },
          residence_type: true,
        },
      }),

      // ── 3d. Attendance records for last 7 days (present/late) ──
      db.attendance.findMany({
        where: {
          timestamp: { gte: sevenDaysAgo, lte: endOfDay },
          status: { in: ["1", "3"] },
        },
        select: { timestamp: true },
      }),
    ]);

    // ─────────────────────────────────────────────
    // 2. Process results
    // ─────────────────────────────────────────────

    // ── Key Metrics ──
    const totalStudents = studentEnrollmentGroups.length;
    const activeParents = parentEnrollmentGroups.length;

    // ── Financial Overview ──
    const totalRevenue = revenueAggregate._sum.amount ?? 0;
    const totalBilled = billedAggregate._sum.amount ?? 0;
    const collectionRate =
      totalBilled > 0 ? Math.round((totalRevenue / totalBilled) * 100) : 0;

    let collectionLabel = "Needs Attention";
    let collectionColor = "red";
    if (collectionRate >= 80) {
      collectionLabel = "Excellent";
      collectionColor = "emerald";
    } else if (collectionRate >= 60) {
      collectionLabel = "Good";
      collectionColor = "amber";
    }

    const pendingPayments = pendingPaymentGroups.length;

    // ── Financial Summary ──
    const financialSummary = {
      unpaidInvoices: {
        count: unpaidInvoicesAggregate._count || 0,
        amount: unpaidInvoicesAggregate._sum.due ?? 0,
      },
      totalIncome: {
        count: totalIncomeAggregate._count || 0,
        amount: totalIncomeAggregate._sum.amount ?? 0,
      },
      totalExpenses: {
        amount: totalExpenseAggregate._sum.amount ?? 0,
      },
    };

    // ── Chart: Student Distribution by Class ──
    const classCountMap = new Map<string, number>();
    for (const e of enrollmentDetails) {
      const className = e.class?.name || "Unknown";
      classCountMap.set(className, (classCountMap.get(className) || 0) + 1);
    }

    const studentDistribution = Array.from(classCountMap.entries())
      .filter(([, count]) => count > 0)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // ── Chart: Gender Distribution by Class ──
    const genderMap = new Map<
      string,
      { male: number; female: number; total: number }
    >();

    for (const e of enrollmentDetails) {
      const className = e.class?.name || "Unknown";
      if (!genderMap.has(className)) {
        genderMap.set(className, { male: 0, female: 0, total: 0 });
      }
      const data = genderMap.get(className)!;
      data.total += 1;

      const sex = (e.student?.sex || "").toLowerCase();
      if (sex === "male" || sex === "m" || sex === "1") {
        data.male += 1;
      } else if (sex === "female" || sex === "f" || sex === "2") {
        data.female += 1;
      }
    }

    const genderDistribution = Array.from(genderMap.entries())
      .map(([className, data]) => ({
        className,
        male: data.male,
        female: data.female,
        total: data.total,
      }))
      .sort((a, b) => a.className.localeCompare(b.className));

    // ── Chart: Residential Distribution by Class ──
    const residentialMap = new Map<string, Map<string, number>>();

    for (const e of enrollmentDetails) {
      const className = e.class?.name || "Unknown";
      const rt = e.residence_type || "Unknown";
      if (!residentialMap.has(className)) {
        residentialMap.set(className, new Map());
      }
      const classMap = residentialMap.get(className)!;
      classMap.set(rt, (classMap.get(rt) || 0) + 1);
    }

    const residentialDistribution: {
      className: string;
      residenceType: string;
      count: number;
    }[] = [];

    for (const [className, types] of residentialMap) {
      for (const [residenceType, count] of types) {
        residentialDistribution.push({ className, residenceType, count });
      }
    }
    residentialDistribution.sort((a, b) =>
      a.className.localeCompare(b.className),
    );

    // ── Chart: Attendance Trend (Last 7 Days) ──
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Build lookup map: YYYY-MM-DD -> count
    const trendCountMap = new Map<string, number>();
    for (const r of attendanceTrendRecords) {
      if (r.timestamp) {
        const dateStr = r.timestamp.toISOString().split("T")[0];
        trendCountMap.set(dateStr, (trendCountMap.get(dateStr) || 0) + 1);
      }
    }

    const attendanceTrend = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(sevenDaysAgo);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      return {
        date: dateStr,
        day: dayNames[date.getDay()],
        count: trendCountMap.get(dateStr) || 0,
      };
    });

    // ── Recent Payments ──
    const formattedPayments = recentPayments.map((p) => ({
      studentName:
        p.student?.name ||
        [p.student?.first_name, p.student?.last_name].filter(Boolean).join(" ") ||
        "Unknown",
      amount: p.amount,
      method: p.payment_method || "N/A",
      date: p.timestamp?.toISOString() || null,
      invoiceCode: p.invoice_code || "",
    }));

    // ─────────────────────────────────────────────
    // 3. Build response
    // ─────────────────────────────────────────────
    return NextResponse.json({
      academicTerm: {
        year: runningYear,
        term: runningTerm,
      },
      stats: {
        totalStudents,
        activeTeachers: activeTeachersCount,
        activeParents,
        attendanceToday: attendanceTodayCount,
      },
      financial: {
        totalRevenue,
        totalBilled,
        collectionRate,
        collectionLabel,
        collectionColor,
        pendingPayments,
      },
      financialSummary,
      charts: {
        studentDistribution,
        attendanceTrend,
        genderDistribution,
        residentialDistribution,
      },
      recentPayments: formattedPayments,
    });
  } catch (error) {
    console.error("[Dashboard API] Error loading dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 },
    );
  }
}
