import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const rates = await db.daily_fee_rates.findMany({
      include: { class: { select: { class_id: true, name: true, category: true } } },
      orderBy: { class: { name_numeric: 'asc' } },
    });
    return NextResponse.json(rates);
  } catch (error) {
    console.error('Error fetching daily fee rates:', error);
    return NextResponse.json({ error: 'Failed to fetch rates' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { rates } = body;

    const results = [];
    for (const rate of rates) {
      const updated = await db.daily_fee_rates.upsert({
        where: { id: rate.id || 0 },
        update: {
          feeding_rate: rate.feeding_rate,
          breakfast_rate: rate.breakfast_rate,
          classes_rate: rate.classes_rate,
          water_rate: rate.water_rate,
          year: rate.year || '2026',
          term: rate.term || 'Term 1',
        },
        create: {
          class_id: rate.class_id,
          feeding_rate: rate.feeding_rate,
          breakfast_rate: rate.breakfast_rate,
          classes_rate: rate.classes_rate,
          water_rate: rate.water_rate,
          year: rate.year || '2026',
          term: rate.term || 'Term 1',
        },
      });
      results.push(updated);
    }

    return NextResponse.json({ rates: results, message: 'Rates updated successfully' });
  } catch (error) {
    console.error('Error updating daily fee rates:', error);
    return NextResponse.json({ error: 'Failed to update rates' }, { status: 500 });
  }
}
