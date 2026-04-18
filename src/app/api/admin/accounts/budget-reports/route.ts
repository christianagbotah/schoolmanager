import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/admin/accounts/budget-reports — generate budget reports
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fiscalYearId = searchParams.get("fiscalYearId") || "";
    const departmentId = searchParams.get("departmentId") || "";
    const reportType = searchParams.get("reportType") || "overview";

    // Base filters
    const budgetWhere: Record<string, unknown> = {};
    if (fiscalYearId) budgetWhere.fiscal_year_id = Number(fiscalYearId);
    if (departmentId) budgetWhere.department_id = Number(departmentId);

    const budgets = await db.budgets.findMany({
      where: budgetWhere,
      include: { fiscal_years: true, department: true },
      orderBy: { budget_id: "desc" },
    });

    const budgetIds = budgets.map((b) => b.budget_id);

    const allLines = budgetIds.length > 0
      ? await db.budget_lines.findMany({
          where: { budget_id: { in: budgetIds } },
          include: { chart_of_accounts: true },
        })
      : [];

    // ===== Overview Report =====
    const overview = {
      totalBudgets: budgets.length,
      totalBudgeted: allLines.reduce((s, l) => s + l.budgeted_amount, 0),
      totalActual: allLines.reduce((s, l) => s + l.actual_amount, 0),
      totalVariance: allLines.reduce((s, l) => s + l.variance, 0),
      utilizationPercent: allLines.reduce((s, l) => s + l.budgeted_amount, 0) > 0
        ? Math.round((allLines.reduce((s, l) => s + l.actual_amount, 0) / allLines.reduce((s, l) => s + l.budgeted_amount, 0)) * 100)
        : 0,
      statusBreakdown: {
        draft: budgets.filter((b) => b.status === "draft").length,
        active: budgets.filter((b) => b.status === "active").length,
        approved: budgets.filter((b) => b.status === "approved").length,
        closed: budgets.filter((b) => b.status === "closed").length,
        cancelled: budgets.filter((b) => b.status === "cancelled").length,
      },
    };

    // ===== Budget vs Actual Comparison =====
    const budgetVsActual = budgets.map((b) => {
      const lines = allLines.filter((l) => l.budget_id === b.budget_id);
      const totalBudgeted = lines.reduce((s, l) => s + l.budgeted_amount, 0);
      const totalActual = lines.reduce((s, l) => s + l.actual_amount, 0);
      return {
        budget_id: b.budget_id,
        name: b.name,
        fiscalYear: b.fiscal_years?.name || "—",
        department: b.department?.dep_name || "—",
        status: b.status,
        totalBudgeted,
        totalActual,
        variance: totalBudgeted - totalActual,
        utilizationPercent: totalBudgeted > 0 ? Math.round((totalActual / totalBudgeted) * 100) : 0,
        lineCount: lines.length,
        lines: lines.map((l) => ({
          budget_line_id: l.budget_line_id,
          accountCode: l.chart_of_accounts?.account_code || "",
          accountName: l.chart_of_accounts?.account_name || "N/A",
          category: l.category,
          description: l.description,
          budgeted_amount: l.budgeted_amount,
          actual_amount: l.actual_amount,
          variance: l.variance,
          variancePercent: l.budgeted_amount > 0
            ? Math.round(((l.budgeted_amount - l.actual_amount) / l.budgeted_amount) * 100)
            : 0,
        })),
      };
    });

    // ===== Utilization by Category =====
    const categoryMap: Record<string, { budgeted: number; actual: number; count: number }> = {};
    for (const line of allLines) {
      const cat = line.category || "Uncategorized";
      if (!categoryMap[cat]) categoryMap[cat] = { budgeted: 0, actual: 0, count: 0 };
      categoryMap[cat].budgeted += line.budgeted_amount;
      categoryMap[cat].actual += line.actual_amount;
      categoryMap[cat].count += 1;
    }
    const utilizationByCategory = Object.entries(categoryMap).map(([category, data]) => ({
      category,
      ...data,
      variance: data.budgeted - data.actual,
      utilizationPercent: data.budgeted > 0 ? Math.round((data.actual / data.budgeted) * 100) : 0,
    })).sort((a, b) => b.actual - a.actual);

    // ===== Utilization by Department =====
    const deptMap: Record<string, { budgeted: number; actual: number; budgetCount: number }> = {};
    for (const b of budgets) {
      const deptName = b.department?.dep_name || "Unassigned";
      if (!deptMap[deptName]) deptMap[deptName] = { budgeted: 0, actual: 0, budgetCount: 0 };
      const lines = allLines.filter((l) => l.budget_id === b.budget_id);
      deptMap[deptName].budgeted += lines.reduce((s, l) => s + l.budgeted_amount, 0);
      deptMap[deptName].actual += lines.reduce((s, l) => s + l.actual_amount, 0);
      deptMap[deptName].budgetCount += 1;
    }
    const utilizationByDepartment = Object.entries(deptMap).map(([department, data]) => ({
      department,
      ...data,
      variance: data.budgeted - data.actual,
      utilizationPercent: data.budgeted > 0 ? Math.round((data.actual / data.budgeted) * 100) : 0,
    })).sort((a, b) => b.actual - a.actual);

    // ===== Top Variances (over/under budget) =====
    const lineVariances = allLines.map((l) => ({
      budget_line_id: l.budget_line_id,
      description: l.description,
      accountName: l.chart_of_accounts?.account_name || "N/A",
      budgeted_amount: l.budgeted_amount,
      actual_amount: l.actual_amount,
      variance: l.variance,
      variancePercent: l.budgeted_amount > 0
        ? Math.round(((l.budgeted_amount - l.actual_amount) / l.budgeted_amount) * 100)
        : 0,
    }));
    const topOverBudget = lineVariances
      .filter((l) => l.variance < 0)
      .sort((a, b) => a.variance - b.variance)
      .slice(0, 10);
    const topUnderBudget = lineVariances
      .filter((l) => l.variance > 0)
      .sort((a, b) => b.variance - a.variance)
      .slice(0, 10);

    // ===== Period-over-period (by fiscal year comparison) =====
    const fiscalYears = fiscalYearId
      ? await db.fiscal_years.findMany({ where: { fiscal_year_id: Number(fiscalYearId) } })
      : await db.fiscal_years.findMany({ orderBy: { fiscal_year_id: "desc" } });

    const periodComparison = fiscalYears.map((fy) => {
      const fyBudgets = budgets.filter((b) => b.fiscal_year_id === fy.fiscal_year_id);
      const fyLines = allLines.filter((l) => fyBudgets.some((b) => b.budget_id === l.budget_id));
      return {
        fiscal_year_id: fy.fiscal_year_id,
        name: fy.name,
        status: fy.status,
        budgetCount: fyBudgets.length,
        totalBudgeted: fyLines.reduce((s, l) => s + l.budgeted_amount, 0),
        totalActual: fyLines.reduce((s, l) => s + l.actual_amount, 0),
        totalVariance: fyLines.reduce((s, l) => s + l.variance, 0),
      };
    });

    // ===== Monthly trend data (last 12 months) =====
    const now = new Date();
    const monthlyTrend: Array<{ month: string; budgeted: number; actual: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const logsInMonth = await db.budget_utilization_log.findMany({
        where: {
          created_at: { gte: monthStart, lte: monthEnd },
          budget_line_id: { in: allLines.map((l) => l.budget_line_id) },
        },
      });

      monthlyTrend.push({
        month: monthKey,
        budgeted: 0, // budget is set at line level, not monthly
        actual: logsInMonth.reduce((s, l) => s + l.amount, 0),
      });
    }

    return NextResponse.json({
      reportType,
      overview,
      budgetVsActual,
      utilizationByCategory,
      utilizationByDepartment,
      topOverBudget,
      topUnderBudget,
      periodComparison,
      monthlyTrend,
      filters: { fiscalYearId: fiscalYearId || null, departmentId: departmentId || null },
    });
  } catch (error) {
    console.error("GET /api/admin/accounts/budget-reports error:", error);
    return NextResponse.json({ error: "Failed to generate budget report" }, { status: 500 });
  }
}
