import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Unified Dashboard Stats API
 * Returns all dashboard statistics for the logged-in user.
 * Permission-aware: filters data based on the user's role/permissions.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role as string;
    const permissions = (session.user.permissions as string[]) || [];

    // Parse optional filters
    const { searchParams } = new URL(request.url);
    const filterYear = searchParams.get("year");
    const filterTerm = searchParams.get("term");
    const filterDate = searchParams.get("date");

    // Resolve running year/term
    const settingsRecords = await db.settings.findMany({
      where: { type: { in: ["running_year", "running_term"] } },
    });

    const runningYear =
      filterYear ||
      settingsRecords.find((s) => s.type === "running_year")?.description ||
      String(new Date().getFullYear());

    const runningTerm =
      filterTerm ||
      settingsRecords.find((s) => s.type === "running_term")?.description ||
      "Term 1";

    // Date setup
    const referenceDate = filterDate
      ? new Date(filterDate + "T00:00:00")
      : new Date();
    const startOfDay = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate()
    );
    const endOfDay = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate(),
      23,
      59,
      59,
      999
    );
    const sevenDaysAgo = new Date(startOfDay);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    // ─── Determine what data this role can see ───
    const canViewStudents = permissions.includes("can_view_students_list");
    const canViewTeachers = permissions.includes("can_view_teachers_list");
    const canViewParents = permissions.includes("can_view_parents_list");
    const canViewFinancial = permissions.some((p) =>
      [
        "can_view_financial_reports",
        "can_receive_payment",
        "can_view_invoices",
        "can_bill_students",
        "can_view_daily_fee_reports",
      ].includes(p)
    );
    const canViewAcademic = permissions.some((p) =>
      ["can_view_academic_reports", "can_enter_marks", "can_view_marks", "can_manage_exams"].includes(p)
    );
    const canManageSettings = permissions.includes("can_manage_settings");
    const isAdminLike = ["super-admin", "admin"].includes(role);
    const isTeacher = role === "teacher";
    const isStudent = role === "student";
    const isParent = role === "parent";
    const isAccountant = role === "accountant";

    // ─── Fetch data in parallel (only what's needed for this role) ───
    const queries: Promise<unknown>[] = [];

    // Core stats — visible to most roles
    if (canViewStudents || isAdminLike) {
      queries.push(
        db.enroll.groupBy({
          by: ["student_id"],
          where: { year: runningYear, term: runningTerm, mute: 0 },
        })
      );
      queries.push(
        db.enroll.findMany({
          where: { year: runningYear, term: runningTerm, mute: 0 },
          select: {
            class_id: true,
            class: { select: { name: true } },
            student: { select: { sex: true } },
            residence_type: true,
          },
        })
      );
    } else {
      queries.push(Promise.resolve([]));
      queries.push(Promise.resolve([]));
    }

    if (canViewTeachers || isAdminLike) {
      queries.push(db.teacher.count({ where: { active_status: 1 } }));
    } else {
      queries.push(Promise.resolve(0));
    }

    if (canViewParents || isAdminLike) {
      queries.push(
        db.enroll.groupBy({
          by: ["parent_id"],
          where: { year: runningYear, term: runningTerm, mute: 0, parent_id: { not: null } },
        })
      );
    } else {
      queries.push(Promise.resolve([]));
    }

    // Attendance
    if (canManageSettings || canViewStudents || isTeacher) {
      queries.push(
        db.attendance.count({
          where: {
            timestamp: { gte: startOfDay, lte: endOfDay },
            status: { in: ["1", "3"] },
          },
        })
      );
      queries.push(
        db.attendance.findMany({
          where: {
            timestamp: { gte: sevenDaysAgo, lte: endOfDay },
            status: { in: ["1", "3"] },
          },
          select: { timestamp: true },
        })
      );
    } else {
      queries.push(Promise.resolve(0));
      queries.push(Promise.resolve([]));
    }

    // Financial
    if (canViewFinancial || isAdminLike || isAccountant) {
      queries.push(
        db.payment.aggregate({
          _sum: { amount: true },
          where: {
            year: runningYear,
            term: runningTerm,
            payment_type: "income",
            can_delete: { not: "trash" },
          },
        })
      );
      queries.push(
        db.invoice.aggregate({
          _sum: { amount: true },
          where: {
            year: runningYear,
            term: runningTerm,
            mute: 0,
            can_delete: { not: "trash" },
          },
        })
      );
      queries.push(
        db.invoice.groupBy({
          by: ["student_id"],
          where: { status: "unpaid", year: runningYear, term: runningTerm },
        })
      );
    } else {
      queries.push(Promise.resolve({ _sum: { amount: 0 } }));
      queries.push(Promise.resolve({ _sum: { amount: 0 } }));
      queries.push(Promise.resolve([]));
    }

    // Financial summary (super-admin/settings)
    if (canManageSettings) {
      queries.push(
        db.invoice.aggregate({
          _count: true,
          _sum: { due: true },
          where: { year: runningYear, term: runningTerm, due: { gt: 0 }, mute: 0, can_delete: { not: "trash" } },
        })
      );
      queries.push(
        db.payment.aggregate({
          _count: true,
          _sum: { amount: true },
          where: { payment_type: "income", can_delete: { not: "trash" } },
        })
      );
      queries.push(
        db.payment.aggregate({
          _sum: { amount: true },
          where: { payment_type: "expense", can_delete: { not: "trash" } },
        })
      );
    } else {
      queries.push(Promise.resolve({ _count: 0, _sum: { due: 0 } }));
      queries.push(Promise.resolve({ _count: 0, _sum: { amount: 0 } }));
      queries.push(Promise.resolve({ _sum: { amount: 0 } }));
    }

    // Recent payments
    if (canViewFinancial || isAdminLike) {
      queries.push(
        db.payment.findMany({
          take: 10,
          orderBy: { timestamp: "desc" },
          include: { student: { select: { name: true, first_name: true, last_name: true } } },
        })
      );
    } else {
      queries.push(Promise.resolve([]));
    }

    // Fee collection breakdown
    if (canViewFinancial) {
      queries.push(
        db.invoice.aggregate({
          _count: true,
          _sum: { amount: true, paid: true },
          where: { year: runningYear, term: runningTerm, status: "paid", mute: 0, can_delete: { not: "trash" } },
        })
      );
      queries.push(
        db.invoice.aggregate({
          _count: true,
          _sum: { amount: true, paid: true },
          where: { year: runningYear, term: runningTerm, status: "partial", mute: 0, can_delete: { not: "trash" } },
        })
      );
      queries.push(
        db.invoice.count({
          where: { year: runningYear, term: runningTerm, status: "unpaid", mute: 0, can_delete: { not: "trash" } },
        })
      );
    } else {
      queries.push(Promise.resolve({ _count: 0, _sum: { amount: 0 } }));
      queries.push(Promise.resolve({ _count: 0, _sum: { amount: 0 } }));
      queries.push(Promise.resolve(0));
    }

    // Classes count
    queries.push(
      db.enroll.groupBy({
        by: ["class_id"],
        where: { year: runningYear, term: runningTerm, mute: 0 },
      })
    );

    const results = await Promise.all(queries);

    let idx = 0;
    const studentEnrollmentGroups = results[idx++] as { student_id: number }[];
    const enrollmentDetails = results[idx++] as {
      class_id: number;
      class: { name: string };
      student: { sex: string };
      residence_type: string;
    }[];
    const activeTeachersCount = results[idx++] as number;
    const parentEnrollmentGroups = results[idx++] as { parent_id: number }[];
    const attendanceTodayCount = results[idx++] as number;
    const attendanceTrendRecords = results[idx++] as { timestamp: Date | null }[];
    const revenueAggregate = results[idx++] as { _sum: { amount: number | null } };
    const billedAggregate = results[idx++] as { _sum: { amount: number | null } };
    const pendingPaymentGroups = results[idx++] as { student_id: number }[];
    const unpaidInvoicesAggregate = results[idx++] as { _count: number; _sum: { due: number | null } };
    const totalIncomeAggregate = results[idx++] as { _count: number; _sum: { amount: number | null } };
    const totalExpenseAggregate = results[idx++] as { _sum: { amount: number | null } };
    const recentPayments = results[idx++] as {
      student?: { name?: string; first_name?: string; last_name?: string };
      amount: number;
      payment_method: string;
      timestamp: Date | null;
      invoice_code: string;
    }[];
    const paidInvoicesAggregate = results[idx++] as { _count: number; _sum: { amount: number | null; paid: number | null } };
    const partialInvoicesAggregate = results[idx++] as { _count: number; _sum: { amount: number | null; paid: number | null } };
    const unpaidInvoicesCount = results[idx++] as number;
    const totalClassesCount = results[idx++] as { class_id: number }[];

    // ─── Process results ───
    const totalStudents = studentEnrollmentGroups.length;
    const activeParents = parentEnrollmentGroups.length;
    const totalClasses = totalClassesCount.length;
    const totalRevenue = revenueAggregate._sum.amount ?? 0;
    const totalBilled = billedAggregate._sum.amount ?? 0;
    const collectionRate = totalBilled > 0 ? Math.round((totalRevenue / totalBilled) * 100) : 0;

    let collectionLabel = "Needs Attention";
    let collectionColor = "red";
    if (collectionRate >= 80) { collectionLabel = "Excellent"; collectionColor = "emerald"; }
    else if (collectionRate >= 60) { collectionLabel = "Good"; collectionColor = "amber"; }

    const pendingPayments = pendingPaymentGroups.length;

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

    // Student distribution by class
    const classCountMap = new Map<string, number>();
    for (const e of enrollmentDetails) {
      const cn = e.class?.name || "Unknown";
      classCountMap.set(cn, (classCountMap.get(cn) || 0) + 1);
    }
    const studentDistribution = Array.from(classCountMap.entries())
      .filter(([, c]) => c > 0)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Gender distribution
    const genderMap = new Map<string, { male: number; female: number; total: number }>();
    for (const e of enrollmentDetails) {
      const cn = e.class?.name || "Unknown";
      if (!genderMap.has(cn)) genderMap.set(cn, { male: 0, female: 0, total: 0 });
      const d = genderMap.get(cn)!;
      d.total += 1;
      const sex = (e.student?.sex || "").toLowerCase();
      if (sex === "male" || sex === "m" || sex === "1") d.male += 1;
      else if (sex === "female" || sex === "f" || sex === "2") d.female += 1;
    }
    const genderDistribution = Array.from(genderMap.entries())
      .map(([className, data]) => ({ className, male: data.male, female: data.female, total: data.total }))
      .sort((a, b) => a.className.localeCompare(b.className));

    // Residential distribution
    const residentialMap = new Map<string, Map<string, number>>();
    for (const e of enrollmentDetails) {
      const cn = e.class?.name || "Unknown";
      const rt = e.residence_type || "Unknown";
      if (!residentialMap.has(cn)) residentialMap.set(cn, new Map());
      residentialMap.get(cn)!.set(rt, (residentialMap.get(cn)!.get(rt) || 0) + 1);
    }
    const residentialDistribution: { className: string; residenceType: string; count: number }[] = [];
    for (const [cn, types] of residentialMap) {
      for (const [rt, count] of types) residentialDistribution.push({ className: cn, residenceType: rt, count });
    }
    residentialDistribution.sort((a, b) => a.className.localeCompare(b.className));

    // Attendance trend
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const trendCountMap = new Map<string, number>();
    for (const r of attendanceTrendRecords) {
      if (r.timestamp) {
        const ds = r.timestamp.toISOString().split("T")[0];
        trendCountMap.set(ds, (trendCountMap.get(ds) || 0) + 1);
      }
    }
    const attendanceTrend = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(sevenDaysAgo);
      date.setDate(date.getDate() + i);
      const ds = date.toISOString().split("T")[0];
      return { date: ds, day: dayNames[date.getDay()], count: trendCountMap.get(ds) || 0 };
    });

    // Recent payments formatted
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

    // Fee collection breakdown
    const feeCollectionBreakdown = {
      paid: { count: paidInvoicesAggregate._count || 0, amount: paidInvoicesAggregate._sum.amount ?? 0 },
      partial: { count: partialInvoicesAggregate._count || 0, amount: partialInvoicesAggregate._sum.amount ?? 0 },
      unpaid: {
        count: unpaidInvoicesCount || 0,
        amount: totalBilled - (paidInvoicesAggregate._sum.amount ?? 0) - (partialInvoicesAggregate._sum.paid ?? 0),
      },
    };

    // ─── Build response ───
    return NextResponse.json({
      academicTerm: { year: runningYear, term: runningTerm },
      stats: {
        totalStudents,
        activeTeachers: activeTeachersCount,
        activeParents,
        totalClasses,
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
        feeCollectionBreakdown,
      },
      recentPayments: formattedPayments,
      // Role metadata for client-side adaptation
      meta: { role, permissions },
    });
  } catch (error) {
    console.error("[Dashboard Stats API] Error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard statistics" },
      { status: 500 }
    );
  }
}
