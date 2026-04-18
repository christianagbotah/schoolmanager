import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/admin/budgets/[id] — single budget with lines and utilization
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const budgetId = Number(id);

    const budget = await db.budgets.findUnique({
      where: { budget_id: budgetId },
      include: {
        fiscal_years: true,
        department: true,
      },
    });

    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    const lines = await db.budget_lines.findMany({
      where: { budget_id: budgetId },
      include: {
        chart_of_accounts: true,
      },
      orderBy: { budget_line_id: "asc" },
    });

    const utilizationLogs = await db.budget_utilization_log.findMany({
      where: {
        budget_line_id: { in: lines.map((l) => l.budget_line_id) },
      },
      orderBy: { created_at: "desc" },
      take: 50,
    });

    const summary = {
      totalBudgeted: lines.reduce((s, l) => s + l.budgeted_amount, 0),
      totalActual: lines.reduce((s, l) => s + l.actual_amount, 0),
      totalVariance: lines.reduce((s, l) => s + l.variance, 0),
      lineCount: lines.length,
    };

    return NextResponse.json({ budget, lines, utilizationLogs, summary });
  } catch (error) {
    console.error("GET /api/admin/budgets/[id] error:", error);
    return NextResponse.json({ error: "Failed to load budget" }, { status: 500 });
  }
}

// PUT /api/admin/budgets/[id] — update budget and lines
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const budgetId = Number(id);
    const body = await req.json();
    const { name, fiscalYearId, departmentId, totalAmount, status, description, lines } = body;

    const existing = await db.budgets.findUnique({ where: { budget_id: budgetId } });
    if (!existing) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    const updated = await db.budgets.update({
      where: { budget_id: budgetId },
      data: {
        name: name ?? existing.name,
        fiscal_year_id: fiscalYearId !== undefined ? (fiscalYearId ? Number(fiscalYearId) : null) : existing.fiscal_year_id,
        department_id: departmentId !== undefined ? (departmentId ? Number(departmentId) : null) : existing.department_id,
        total_amount: totalAmount !== undefined ? Number(totalAmount) : existing.total_amount,
        status: status ?? existing.status,
        description: description ?? existing.description,
      },
    });

    // If lines provided, sync them
    if (lines && Array.isArray(lines)) {
      // Delete removed lines
      const existingLineIds = lines.filter((l: { budget_line_id?: number }) => l.budget_line_id).map((l: { budget_line_id: number }) => l.budget_line_id);
      if (existingLineIds.length > 0) {
        const currentLines = await db.budget_lines.findMany({
          where: { budget_id: budgetId },
          select: { budget_line_id: true },
        });
        const toDelete = currentLines.filter((cl) => !existingLineIds.includes(cl.budget_line_id));
        for (const d of toDelete) {
          await db.budget_lines.delete({ where: { budget_line_id: d.budget_line_id } });
        }
      }

      // Upsert lines
      for (const line of lines) {
        const data = {
          account_id: line.accountId ? Number(line.accountId) : null,
          category: line.category || "",
          description: line.description || "",
          budgeted_amount: Number(line.budgetedAmount) || 0,
          actual_amount: Number(line.actualAmount) || 0,
          variance: (Number(line.budgetedAmount) || 0) - (Number(line.actualAmount) || 0),
        };

        if (line.budget_line_id) {
          await db.budget_lines.update({
            where: { budget_line_id: line.budget_line_id },
            data,
          });
        } else {
          await db.budget_lines.create({
            data: {
              budget_id: budgetId,
              ...data,
            },
          });
        }
      }
    }

    return NextResponse.json({ budget: updated, message: "Budget updated successfully" });
  } catch (error) {
    console.error("PUT /api/admin/budgets/[id] error:", error);
    return NextResponse.json({ error: "Failed to update budget" }, { status: 500 });
  }
}

// DELETE /api/admin/budgets/[id] — soft delete (cancel)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const budgetId = Number(id);

    const existing = await db.budgets.findUnique({ where: { budget_id: budgetId } });
    if (!existing) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    const cancelled = await db.budgets.update({
      where: { budget_id: budgetId },
      data: { status: "cancelled" },
    });

    return NextResponse.json({ budget: cancelled, message: "Budget cancelled" });
  } catch (error) {
    console.error("DELETE /api/admin/budgets/[id] error:", error);
    return NextResponse.json({ error: "Failed to cancel budget" }, { status: 500 });
  }
}
