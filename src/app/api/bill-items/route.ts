import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');

    const where: Record<string, unknown> = {};
    if (categoryId) where.bill_category_id = parseInt(categoryId);

    const items = await db.bill_item.findMany({
      where,
      include: { bill_category: true },
      orderBy: { title: 'asc' },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching bill items:', error);
    return NextResponse.json({ error: 'Failed to fetch bill items' }, { status: 500 });
  }
}
