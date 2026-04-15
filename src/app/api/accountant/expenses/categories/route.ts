import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const categories = await db.expense_category.findMany({
      orderBy: { expense_category_name: 'asc' },
    });

    const withCounts = await Promise.all(
      categories.map(async (cat) => {
        const expenseCount = await db.expense.count({
          where: { category_id: cat.expense_category_id },
        });
        const totalAmount = await db.expense.aggregate({
          where: { category_id: cat.expense_category_id },
          _sum: { amount: true },
        });
        return {
          expense_category_id: cat.expense_category_id,
          expense_category_name: cat.expense_category_name,
          expenseCount,
          totalAmount: totalAmount._sum.amount || 0,
        };
      })
    );

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
