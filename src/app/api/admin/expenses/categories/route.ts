import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/expenses/categories - List all expense categories
export async function GET(request: NextRequest) {
  try {
    const categories = await db.expense_category.findMany({
      include: {
        expenses: {
          select: { id: true, amount: true },
        },
      },
      orderBy: { expense_category_id: 'asc' },
    });

    const categoriesWithStats = categories.map(cat => ({
      expense_category_id: cat.expense_category_id,
      expense_category_name: cat.expense_category_name,
      expenseCount: cat.expenses.length,
      totalAmount: cat.expenses.reduce((sum, e) => sum + e.amount, 0),
    }));

    const totalCategories = categories.length;
    const totalExpenses = categoriesWithStats.reduce((s, c) => s + c.expenseCount, 0);
    const totalSpent = categoriesWithStats.reduce((s, c) => s + c.totalAmount, 0);

    return NextResponse.json({
      categories: categoriesWithStats,
      stats: { totalCategories, totalExpenses, totalSpent },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/expenses/categories - Create category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Category name required' }, { status: 400 });
    }

    // Check duplicate
    const existing = await db.expense_category.findFirst({
      where: { expense_category_name: name.trim() },
    });
    if (existing) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 400 });
    }

    const category = await db.expense_category.create({
      data: { expense_category_name: name.trim() },
    });

    return NextResponse.json({ status: 'success', message: 'Category created', category }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/expenses/categories - Update category
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name } = body;

    if (!id || !name?.trim()) {
      return NextResponse.json({ error: 'ID and name required' }, { status: 400 });
    }

    const existing = await db.expense_category.findFirst({
      where: { expense_category_name: name.trim(), expense_category_id: { not: id } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Category name already exists' }, { status: 400 });
    }

    await db.expense_category.update({
      where: { expense_category_id: id },
      data: { expense_category_name: name.trim() },
    });

    return NextResponse.json({ status: 'success', message: 'Category updated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/expenses/categories - Delete category
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '0');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    // Check if category has expenses
    const expensesCount = await db.expense.count({ where: { category_id: id } });
    if (expensesCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete category with ${expensesCount} expenses. Reassign expenses first.` },
        { status: 400 }
      );
    }

    await db.expense_category.delete({ where: { expense_category_id: id } });
    return NextResponse.json({ status: 'success', message: 'Category deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
