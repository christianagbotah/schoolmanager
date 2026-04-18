import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/admin/budgets — list budgets with fiscal year info
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const fiscalYearId = searchParams.get("fiscalYearId") || "";

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (fiscalYearId) where.fiscal_year_id = Number(fiscalYearId);

    const budgets = await db.budgets.findMany({
      where,
      include: {
        fiscal_years: true,
        department: true,
      },
      orderBy: { budget_id: "desc" },
    });

    // Attach aggregated budget lines info
    const enriched = await Promise.all(
      budgets.map(async (b) => {
        const lines = await db.budget_lines.findMany({
          where: { budget_id: b.budget_id },
        });
        const totalBudgeted = lines.reduce((s, l) => s + l.budgeted_amount, 0);
        const totalActual = lines.reduce((s, l) => s + l.actual_amount, 0);
        return {
          ...b,
          _lineCount: lines.length,
          _totalBudgeted: totalBudgeted,
          _totalActual: totalActual,
          _remaining: totalBudgeted - totalActual,
        };
      })
    );

    const summary = {
      totalBudgets: budgets.length,
      totalAmount: budgets.reduce((s, b) => s + b.total_amount, 0),
      totalBudgeted: enriched.reduce((s, b) => s + b._totalBudgeted, 0),
      totalActual: enriched.reduce((s, b) => s + b._totalActual, 0),
      totalRemaining: enriched.reduce((s, b) => s + b._remaining, 0),
    };

    return NextResponse.json({ budgets: enriched, summary });
  } catch (error) {
    console.error("GET /api/admin/budgets error:", error);
    return NextResponse.json({ error: "Failed to load budgets" }, { status: 500 });
  }
}

// POST /api/admin/budgets — create budget with lines
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, fiscalYearId, departmentId, totalAmount, status, description, createdBy, lines } = body;

    if (!name) {
      return NextResponse.json({ error: "Budget name is required" }, { status: 400 });
    }

    const budget = await db.budgets.create({
      data: {
        name,
        fiscal_year_id: fiscalYearId ? Number(fiscalYearId) : null,
        department_id: departmentId ? Number(departmentId) : null,
        total_amount: Number(totalAmount) || 0,
        status: status || "draft",
        description: description || "",
        created_by: createdBy || "",
      },
    });

    if (lines && Array.isArray(lines) && lines.length > 0) {
      for (const line of lines) {
        await db.budget_lines.create({
          data: {
            budget_id: budget.budget_id,
            account_id: line.accountId ? Number(line.accountId) : null,
            category: line.category || "",
            description: line.description || "",
            budgeted_amount: Number(line.budgetedAmount) || 0,
            actual_amount: 0,
            variance: Number(line.budgetedAmount) || 0,
          },
        });
      }
    }

    return NextResponse.json({ budget, message: "Budget created successfully" });
  } catch (error) {
    console.error("POST /api/admin/budgets error:", error);
    return NextResponse.json({ error: "Failed to create budget" }, { status: 500 });
  }
}
