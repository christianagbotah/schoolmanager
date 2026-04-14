import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const categories = await db.expense_category.findMany({
      include: { expenses: { select: { amount: true, status: true } } },
      orderBy: { expense_category_name: 'asc' },
    });

    const withCounts = categories.map(cat => ({
      ...cat,
      expenseCount: cat.expenses.length,
      totalAmount: cat.expenses.reduce((sum, e) => sum + e.amount, 0),
      expenses: undefined,
    }));

    return NextResponse.json(withCounts);
  } catch (error) {
    console.error('Error fetching expense categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const category = await db.expense_category.create({
      data: { expense_category_name: name },
    });

    return NextResponse.json({ category, message: 'Category created successfully' });
  } catch (error) {
    console.error('Error creating expense category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
