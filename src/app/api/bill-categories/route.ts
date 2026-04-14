import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const categories = await db.bill_category.findMany({
      include: { bill_items: true },
      orderBy: { bill_category_name: 'asc' },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching bill categories:', error);
    return NextResponse.json({ error: 'Failed to fetch bill categories' }, { status: 500 });
  }
}
