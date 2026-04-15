import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || '';
    const year = searchParams.get('year') || '';
    const search = searchParams.get('search') || '';

    const where: Record<string, unknown> = {};
    if (month) where.month = month;
    if (year) where.year = year;

    const payslips = await db.pay_salary.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        employee: {
          select: {
            name: true,
            emp_id: true,
            designation: { select: { des_name: true } },
            department: { select: { dep_name: true } },
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    // Apply search filter
    let filtered = payslips;
    if (search) {
      const s = search.toLowerCase();
      filtered = payslips.filter(p =>
        p.employee?.name?.toLowerCase().includes(s) ||
        p.employee_code?.toLowerCase().includes(s)
      );
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Error fetching payslips:', error);
    return NextResponse.json({ error: 'Failed to fetch payslips' }, { status: 500 });
  }
}
