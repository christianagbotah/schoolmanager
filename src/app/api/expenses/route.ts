import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const categoryId = searchParams.get('categoryId') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const status = searchParams.get('status') || '';

    const where: Record<string, unknown> = {};
    if (categoryId) where.category_id = parseInt(categoryId);
    if (status) where.status = status;
    if (startDate && endDate) {
      where.expense_date = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const [expenses, total] = await Promise.all([
      db.expense.findMany({
        where,
        include: { expense_category: true },
        orderBy: { expense_date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.expense.count({ where }),
    ]);

    // Summary calculations
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);

    const [monthTotal, categoryBreakdown] = await Promise.all([
      db.expense.aggregate({
        where: { expense_date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      db.expense.groupBy({
        by: ['category_id'],
        _sum: { amount: true },
        where: { expense_date: { gte: monthStart, lte: monthEnd } },
      }),
    ]);

    const categories = await db.expense_category.findMany();
    const categoryMap = categories.reduce((acc, cat) => {
      acc[cat.expense_category_id] = cat.expense_category_name;
      return acc;
    }, {} as Record<number, string>);

    const breakdown = categoryBreakdown.map(cb => ({
      category: categoryMap[cb.category_id!] || 'Unknown',
      amount: cb._sum.amount || 0,
    }));

    return NextResponse.json({
      expenses,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      summary: {
        monthTotal: monthTotal._sum.amount || 0,
        categoryBreakdown: breakdown,
      },
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, categoryId, amount, expenseDate, paymentMethod } = body;

    if (!title || !amount) {
      return NextResponse.json({ error: 'Title and amount are required' }, { status: 400 });
    }

    const expense = await db.expense.create({
      data: {
        title,
        description: description || '',
        category_id: categoryId ? parseInt(categoryId) : null,
        amount: parseFloat(amount),
        expense_date: expenseDate ? new Date(expenseDate) : new Date(),
        payment_method: paymentMethod || 'cash',
        status: 'approved',
      },
    });

    return NextResponse.json({ expense, message: 'Expense created successfully' });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}
