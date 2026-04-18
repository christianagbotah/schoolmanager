import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/admin/fiscal-periods — list periods for a fiscal year
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fiscalYearId = searchParams.get("fiscalYearId");

    if (!fiscalYearId) {
      return NextResponse.json({ error: "fiscalYearId is required" }, { status: 400 });
    }

    const periods = await db.fiscal_periods.findMany({
      where: { fiscal_year_id: Number(fiscalYearId) },
      orderBy: [{ period_number: "asc" }],
    });

    return NextResponse.json({ periods });
  } catch (error) {
    console.error("GET /api/admin/fiscal-periods error:", error);
    return NextResponse.json({ error: "Failed to load fiscal periods" }, { status: 500 });
  }
}

// POST /api/admin/fiscal-periods — create period
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fiscalYearId, name, periodNumber, startDate, endDate, isClosed } = body;

    if (!fiscalYearId || !name) {
      return NextResponse.json({ error: "fiscalYearId and name are required" }, { status: 400 });
    }

    const period = await db.fiscal_periods.create({
      data: {
        fiscal_year_id: Number(fiscalYearId),
        name,
        period_number: Number(periodNumber) || 0,
        start_date: startDate ? new Date(startDate) : null,
        end_date: endDate ? new Date(endDate) : null,
        is_closed: isClosed ? 1 : 0,
      },
    });

    return NextResponse.json({ period, message: "Fiscal period created successfully" });
  } catch (error) {
    console.error("POST /api/admin/fiscal-periods error:", error);
    return NextResponse.json({ error: "Failed to create fiscal period" }, { status: 500 });
  }
}
