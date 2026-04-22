import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/admin/accounts/budgets/[id]/lines — list budget lines for a budget
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const budgetId = Number(id);

    const budget = await db.budgets.findUnique({
      where: { budget_id: budgetId },
      include: { fiscal_years: true, department: true },
    });

    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    const lines = await db.budget_lines.findMany({
      where: { budget_id: budgetId },
      include: { chart_of_accounts: true },
      orderBy: { budget_line_id: "asc" },
    });

    const utilizationLogs = await db.budget_utilization_log.findMany({
      where: { budget_line_id: { in: lines.map((l) => l.budget_line_id) } },
      orderBy: { created_at: "desc" },
      take: 100,
    });

    const summary = {
      totalBudgeted: lines.reduce((s, l) => s + l.budgeted_amount, 0),
      totalActual: lines.reduce((s, l) => s + l.actual_amount, 0),
      totalVariance: lines.reduce((s, l) => s + l.variance, 0),
      lineCount: lines.length,
      utilizationPercent: lines.reduce((s, l) => s + l.budgeted_amount, 0) > 0
        ? Math.round((lines.reduce((s, l) => s + l.actual_amount, 0) / lines.reduce((s, l) => s + l.budgeted_amount, 0)) * 100)
        : 0,
    };

    // Group logs by line
    const logsByLine: Record<number, typeof utilizationLogs> = {};
    for (const log of utilizationLogs) {
      const lineId = log.budget_line_id!;
      if (!logsByLine[lineId]) logsByLine[lineId] = [];
      logsByLine[lineId].push(log);
    }

    return NextResponse.json({ budget, lines, utilizationLogs, logsByLine, summary });
  } catch (error) {
    console.error("GET /api/admin/accounts/budgets/[id]/lines error:", error);
    return NextResponse.json({ error: "Failed to load budget lines" }, { status: 500 });
  }
}

// POST /api/admin/accounts/budgets/[id]/lines — add budget line
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const budgetId = Number(id);
    const body = await req.json();
    const { accountId, category, description, budgetedAmount } = body;

    const budget = await db.budgets.findUnique({ where: { budget_id: budgetId } });
    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    const line = await db.budget_lines.create({
      data: {
        budget_id: budgetId,
        account_id: accountId ? Number(accountId) : null,
        category: category || "",
        description: description || "",
        budgeted_amount: Number(budgetedAmount) || 0,
        actual_amount: 0,
        variance: Number(budgetedAmount) || 0,
      },
    });

    return NextResponse.json({ line, message: "Budget line added successfully" });
  } catch (error) {
    console.error("POST /api/admin/accounts/budgets/[id]/lines error:", error);
    return NextResponse.json({ error: "Failed to add budget line" }, { status: 500 });
  }
}

// PUT /api/admin/accounts/budgets/[id]/lines — update budget line
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const budgetId = Number(id);
    const body = await req.json();
    const { budgetLineId, accountId, category, description, budgetedAmount, actualAmount } = body;

    if (!budgetLineId) {
      return NextResponse.json({ error: "Budget line ID is required" }, { status: 400 });
    }

    const existing = await db.budget_lines.findUnique({
      where: { budget_line_id: Number(budgetLineId) },
    });

    if (!existing || existing.budget_id !== budgetId) {
      return NextResponse.json({ error: "Budget line not found" }, { status: 404 });
    }

    const budgeted = Number(budgetedAmount) !== undefined ? Number(budgetedAmount) : existing.budgeted_amount;
    const actual = Number(actualAmount) !== undefined ? Number(actualAmount) : existing.actual_amount;

    const updated = await db.budget_lines.update({
      where: { budget_line_id: Number(budgetLineId) },
      data: {
        account_id: accountId !== undefined ? (accountId ? Number(accountId) : null) : existing.account_id,
        category: category ?? existing.category,
        description: description ?? existing.description,
        budgeted_amount: budgeted,
        actual_amount: actual,
        variance: budgeted - actual,
      },
    });

    // Log utilization change if actual amount changed
    if (Number(actualAmount) !== undefined && Number(actualAmount) !== existing.actual_amount) {
      const diff = Number(actualAmount) - existing.actual_amount;
      await db.budget_utilization_log.create({
        data: {
          budget_line_id: Number(budgetLineId),
          transaction_type: diff > 0 ? "expense" : "adjustment",
          amount: Math.abs(diff),
          description: `Adjusted actual from ${existing.actual_amount} to ${Number(actualAmount)}`,
          created_by: "admin",
        },
      });
    }

    return NextResponse.json({ line: updated, message: "Budget line updated successfully" });
  } catch (error) {
    console.error("PUT /api/admin/accounts/budgets/[id]/lines error:", error);
    return NextResponse.json({ error: "Failed to update budget line" }, { status: 500 });
  }
}

// DELETE /api/admin/accounts/budgets/[id]/lines — delete budget line
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const budgetId = Number(id);
    const { searchParams } = new URL(req.url);
    const budgetLineId = searchParams.get("lineId");

    if (!budgetLineId) {
      return NextResponse.json({ error: "Budget line ID is required" }, { status: 400 });
    }

    const existing = await db.budget_lines.findUnique({
      where: { budget_line_id: Number(budgetLineId) },
    });

    if (!existing || existing.budget_id !== budgetId) {
      return NextResponse.json({ error: "Budget line not found" }, { status: 404 });
    }

    await db.budget_lines.delete({
      where: { budget_line_id: Number(budgetLineId) },
    });

    return NextResponse.json({ message: "Budget line deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/admin/accounts/budgets/[id]/lines error:", error);
    return NextResponse.json({ error: "Failed to delete budget line" }, { status: 500 });
  }
}
