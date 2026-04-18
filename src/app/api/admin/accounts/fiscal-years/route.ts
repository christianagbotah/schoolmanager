import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/admin/accounts/fiscal-years — list fiscal years with periods and budget summaries
export async function GET() {
  try {
    const fiscalYears = await db.fiscal_years.findMany({
      orderBy: { fiscal_year_id: "desc" },
    });

    const enriched = await Promise.all(
      fiscalYears.map(async (fy) => {
        const periods = await db.fiscal_periods.findMany({
          where: { fiscal_year_id: fy.fiscal_year_id },
          orderBy: [{ period_number: "asc" }],
        });

        const budgetData = await db.budgets.findMany({
          where: { fiscal_year_id: fy.fiscal_year_id },
        });

        const budgetIds = budgetData.map((b) => b.budget_id);
        const budgetLines = budgetIds.length > 0
          ? await db.budget_lines.findMany({
              where: { budget_id: { in: budgetIds } },
            })
          : [];

        const totalBudgeted = budgetLines.reduce((s, l) => s + l.budgeted_amount, 0);
        const totalActual = budgetLines.reduce((s, l) => s + l.actual_amount, 0);

        return {
          ...fy,
          periods,
          _periodCount: periods.length,
          _budgetCount: budgetData.length,
          _totalBudgeted: totalBudgeted,
          _totalActual: totalActual,
          _totalVariance: totalBudgeted - totalActual,
        };
      })
    );

    const summary = {
      totalFiscalYears: enriched.length,
      activeCount: enriched.filter((fy) => fy.is_active === 1).length,
      totalBudgeted: enriched.reduce((s, fy) => s + fy._totalBudgeted, 0),
      totalActual: enriched.reduce((s, fy) => s + fy._totalActual, 0),
    };

    return NextResponse.json({ fiscalYears: enriched, summary });
  } catch (error) {
    console.error("GET /api/admin/accounts/fiscal-years error:", error);
    return NextResponse.json({ error: "Failed to load fiscal years" }, { status: 500 });
  }
}

// POST /api/admin/accounts/fiscal-years — create fiscal year with periods
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, startDate, endDate, isActive, periods } = body;

    if (!name) {
      return NextResponse.json({ error: "Fiscal year name is required" }, { status: 400 });
    }

    // Deactivate other years if this one is active
    if (isActive) {
      await db.fiscal_years.updateMany({
        where: { is_active: 1 },
        data: { is_active: 0, status: "draft" },
      });
    }

    const fiscalYear = await db.fiscal_years.create({
      data: {
        name,
        start_date: startDate ? new Date(startDate) : null,
        end_date: endDate ? new Date(endDate) : null,
        is_active: isActive ? 1 : 0,
        status: isActive ? "active" : "draft",
      },
    });

    // Create periods if provided
    if (periods && Array.isArray(periods) && periods.length > 0) {
      for (const period of periods) {
        await db.fiscal_periods.create({
          data: {
            fiscal_year_id: fiscalYear.fiscal_year_id,
            name: period.name || "",
            period_number: Number(period.periodNumber) || 0,
            start_date: period.startDate ? new Date(period.startDate) : null,
            end_date: period.endDate ? new Date(period.endDate) : null,
            is_closed: period.isClosed ? 1 : 0,
          },
        });
      }
    }

    return NextResponse.json({ fiscalYear, message: "Fiscal year created successfully" });
  } catch (error) {
    console.error("POST /api/admin/accounts/fiscal-years error:", error);
    return NextResponse.json({ error: "Failed to create fiscal year" }, { status: 500 });
  }
}

// PUT /api/admin/accounts/fiscal-years — update fiscal year
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { fiscalYearId, name, startDate, endDate, isActive, status } = body;

    if (!fiscalYearId) {
      return NextResponse.json({ error: "Fiscal year ID is required" }, { status: 400 });
    }

    const existing = await db.fiscal_years.findUnique({ where: { fiscal_year_id: Number(fiscalYearId) } });
    if (!existing) {
      return NextResponse.json({ error: "Fiscal year not found" }, { status: 404 });
    }

    // Deactivate other years if this one is being activated
    if (isActive && !existing.is_active) {
      await db.fiscal_years.updateMany({
        where: { is_active: 1 },
        data: { is_active: 0, status: "draft" },
      });
    }

    const updated = await db.fiscal_years.update({
      where: { fiscal_year_id: Number(fiscalYearId) },
      data: {
        name: name ?? existing.name,
        start_date: startDate ? new Date(startDate) : existing.start_date,
        end_date: endDate ? new Date(endDate) : existing.end_date,
        is_active: isActive !== undefined ? (isActive ? 1 : 0) : existing.is_active,
        status: status ?? existing.status,
      },
    });

    return NextResponse.json({ fiscalYear: updated, message: "Fiscal year updated successfully" });
  } catch (error) {
    console.error("PUT /api/admin/accounts/fiscal-years error:", error);
    return NextResponse.json({ error: "Failed to update fiscal year" }, { status: 500 });
  }
}

// DELETE /api/admin/accounts/fiscal-years — soft delete (close) fiscal year
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fiscalYearId = searchParams.get("id");

    if (!fiscalYearId) {
      return NextResponse.json({ error: "Fiscal year ID is required" }, { status: 400 });
    }

    const existing = await db.fiscal_years.findUnique({ where: { fiscal_year_id: Number(fiscalYearId) } });
    if (!existing) {
      return NextResponse.json({ error: "Fiscal year not found" }, { status: 404 });
    }

    const updated = await db.fiscal_years.update({
      where: { fiscal_year_id: Number(fiscalYearId) },
      data: { status: "closed", is_active: 0 },
    });

    return NextResponse.json({ fiscalYear: updated, message: "Fiscal year closed" });
  } catch (error) {
    console.error("DELETE /api/admin/accounts/fiscal-years error:", error);
    return NextResponse.json({ error: "Failed to close fiscal year" }, { status: 500 });
  }
}
