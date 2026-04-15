import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const categoryId = searchParams.get('categoryId') || '';
    const status = searchParams.get('status') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const search = searchParams.get('search') || '';

    const where: Record<string, unknown> = {};
    if (categoryId) where.category_id = parseInt(categoryId);
    if (status) where.status = status;
    if (startDate && endDate) {
      where.expense_date = { gte: new Date(startDate), lte: new Date(endDate) };
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [expenses, total, monthAgg, totalAgg] = await Promise.all([
      db.expense.findMany({
        where,
        include: { expense_category: true },
        orderBy: { expense_date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.expense.count({ where }),
      db.expense.aggregate({
        where: { expense_date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
        _count: true,
      }),
      db.expense.aggregate({
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    // Status counts
    const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
      db.expense.count({ where: { status: 'pending' } }),
      db.expense.count({ where: { status: 'approved' } }),
      db.expense.count({ where: { status: 'rejected' } }),
    ]);

    const [pendingAmount, approvedAmount, rejectedAmount] = await Promise.all([
      db.expense.aggregate({ where: { status: 'pending' }, _sum: { amount: true } }),
      db.expense.aggregate({ where: { status: 'approved' }, _sum: { amount: true } }),
      db.expense.aggregate({ where: { status: 'rejected' }, _sum: { amount: true } }),
    ]);

    // Category breakdown for chart
    const categoryBreakdown = await db.expense.groupBy({
      by: ['category_id'],
      _sum: { amount: true },
      where: { expense_date: { gte: monthStart, lte: monthEnd } },
    });

    const categories = await db.expense_category.findMany();
    const categoryMap = categories.reduce((acc, cat) => {
      acc[cat.expense_category_id] = cat.expense_category_name;
      return acc;
    }, {} as Record<number, string>);

    const breakdown = categoryBreakdown.map(cb => ({
      category: categoryMap[cb.category_id!] || 'Uncategorized',
      amount: cb._sum.amount || 0,
    }));

    return NextResponse.json({
      expenses,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      summary: {
        monthTotal: monthAgg._sum.amount || 0,
        monthCount: monthAgg._count || 0,
        total: totalAgg._sum.amount || 0,
        totalCount: totalAgg._count || 0,
      },
      stats: {
        pending: { count: pendingCount, amount: pendingAmount._sum.amount || 0 },
        approved: { count: approvedCount, amount: approvedAmount._sum.amount || 0 },
        rejected: { count: rejectedCount, amount: rejectedAmount._sum.amount || 0 },
      },
      categoryBreakdown: breakdown,
      categories,
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, categoryId, amount, expenseDate, paymentMethod, status } = body;

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
        status: status || 'pending',
      },
    });

    return NextResponse.json({ expense, message: 'Expense created successfully' });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
    }

    const expense = await db.expense.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ expense, message: `Expense ${status} successfully` });
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}
