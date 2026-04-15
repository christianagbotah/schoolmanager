import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/expenses/reports - Expenditure reports with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const status = searchParams.get('status') || '';
    const paymentMethod = searchParams.get('paymentMethod') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const exportFormat = searchParams.get('export') || '';

    const where: any = {};
    if (startDate) {
      where.expense_date = { ...(where.expense_date || {}), gte: new Date(startDate + 'T00:00:00') };
    }
    if (endDate) {
      where.expense_date = { ...(where.expense_date || {}), lte: new Date(endDate + 'T23:59:59') };
    }
    if (categoryId) where.category_id = parseInt(categoryId);
    if (status) where.status = status;
    if (paymentMethod) where.payment_method = paymentMethod;

    const [expenses, total, totalAmount, categoryBreakdown] = await Promise.all([
      db.expense.findMany({
        where,
        include: { expense_category: { select: { expense_category_name: true } } },
        orderBy: { expense_date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.expense.count({ where }),
      db.expense.aggregate({ where, _sum: { amount: true } }),
      db.$queryRaw<any[]>`
        SELECT ec.expense_category_name as category,
               COUNT(e.id) as count,
               COALESCE(SUM(e.amount), 0) as total
        FROM expense e
        LEFT JOIN expense_category ec ON e.category_id = ec.expense_category_id
        WHERE 1=1
        ${startDate ? `AND e.expense_date >= ${startDate + 'T00:00:00'}` : ''}
        ${endDate ? `AND e.expense_date <= ${endDate + 'T23:59:59'}` : ''}
        ${categoryId ? `AND e.category_id = ${parseInt(categoryId)}` : ''}
        ${status ? `AND e.status = ${status}` : ''}
        GROUP BY e.category_id
        ORDER BY total DESC
      `,
    ]);

    // Payment method breakdown
    const methodBreakdown = await db.$queryRaw<any[]>`
      SELECT payment_method, COUNT(*) as count, SUM(amount) as total
      FROM expense
      WHERE 1=1
      ${startDate ? `AND expense_date >= ${startDate + 'T00:00:00'}` : ''}
      ${endDate ? `AND expense_date <= ${endDate + 'T23:59:59'}` : ''}
      ${categoryId ? `AND category_id = ${parseInt(categoryId)}` : ''}
      ${status ? `AND status = ${status}` : ''}
      GROUP BY payment_method
    `;

    // Status breakdown
    const statusBreakdown = await db.$queryRaw<any[]>`
      SELECT status, COUNT(*) as count, SUM(amount) as total
      FROM expense
      WHERE 1=1
      ${startDate ? `AND expense_date >= ${startDate + 'T00:00:00'}` : ''}
      ${endDate ? `AND expense_date <= ${endDate + 'T23:59:59'}` : ''}
      ${categoryId ? `AND category_id = ${parseInt(categoryId)}` : ''}
      GROUP BY status
    `;

    return NextResponse.json({
      expenses,
      pagination: {
        page,
        totalPages: Math.ceil(total / limit),
        total,
      },
      summary: {
        totalAmount: totalAmount._sum.amount || 0,
        count: total,
      },
      categoryBreakdown,
      methodBreakdown,
      statusBreakdown,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
