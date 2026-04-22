import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/admin/fiscal-years — list fiscal years
export async function GET() {
  try {
    const fiscalYears = await db.fiscal_years.findMany({
      orderBy: { fiscal_year_id: "desc" },
    });

    const enriched = await Promise.all(
      fiscalYears.map(async (fy) => {
        const periods = await db.fiscal_periods.count({
          where: { fiscal_year_id: fy.fiscal_year_id },
        });
        const budgetCount = await db.budgets.count({
          where: { fiscal_year_id: fy.fiscal_year_id },
        });
        return {
          ...fy,
          _periodCount: periods,
          _budgetCount: budgetCount,
        };
      })
    );

    return NextResponse.json({ fiscalYears: enriched });
  } catch (error) {
    console.error("GET /api/admin/fiscal-years error:", error);
    return NextResponse.json({ error: "Failed to load fiscal years" }, { status: 500 });
  }
}

// POST /api/admin/fiscal-years — create fiscal year
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, startDate, endDate, isActive } = body;

    if (!name) {
      return NextResponse.json({ error: "Fiscal year name is required" }, { status: 400 });
    }

    // Deactivate other years if this one is active
    if (isActive) {
      await db.fiscal_years.updateMany({
        where: { is_active: 1 },
        data: { is_active: 0 },
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

    return NextResponse.json({ fiscalYear, message: "Fiscal year created successfully" });
  } catch (error) {
    console.error("POST /api/admin/fiscal-years error:", error);
    return NextResponse.json({ error: "Failed to create fiscal year" }, { status: 500 });
  }
}
