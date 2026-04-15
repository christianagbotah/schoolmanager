import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/daily-fees/rates - List all rates with class info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || '';
    const term = searchParams.get('term') || '';
    const classId = searchParams.get('class_id') || '';

    // Get running year/term from settings if not provided
    let filterYear = year;
    let filterTerm = term;
    if (!filterYear || !filterTerm) {
      const settings = await db.settings.findMany({
        where: { type: { in: ['running_year', 'running_term'] } },
      });
      settings.forEach((s: any) => {
        if (s.type === 'running_year') filterYear = s.description;
        if (s.type === 'running_term') filterTerm = s.description;
      });
    }

    const where: any = { year: filterYear, term: filterTerm };
    if (classId) where.class_id = parseInt(classId);

    const rates = await db.daily_fee_rates.findMany({
      where,
      include: { class: { select: { class_id: true, name: true, name_numeric: true, category: true } } },
      orderBy: { id: 'asc' },
    });

    const classes = await db.school_class.findMany({
      orderBy: [{ category: 'asc' }, { name_numeric: 'asc' }, { name: 'asc' }],
    });

    const allRates = await db.daily_fee_rates.findMany({
      where: { year: filterYear, term: filterTerm },
    });
    const totalClasses = classes.length;
    const classesWithRates = new Set(allRates.map((r: any) => r.class_id)).size;

    return NextResponse.json({
      rates,
      classes,
      stats: {
        totalClasses,
        classesWithRates,
        classesWithoutRates: totalClasses - classesWithRates,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/daily-fees/rates - Create or update rates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || 'single';

    // Get running year/term
    const settings = await db.settings.findMany({
      where: { type: { in: ['running_year', 'running_term'] } },
    });
    let year = '', term = '';
    settings.forEach((s: any) => {
      if (s.type === 'running_year') year = s.description;
      if (s.type === 'running_term') term = s.description;
    });

    if (action === 'bulk') {
      // Bulk assign rates to multiple classes
      const { items } = body;
      if (!Array.isArray(items)) {
        return NextResponse.json({ error: 'items array required' }, { status: 400 });
      }

      let created = 0, updated = 0;

      for (const item of items) {
        const { class_id, feeding_rate, breakfast_rate, classes_rate, water_rate, rate_id } = item;
        if (!class_id) continue;

        if (rate_id && rate_id > 0) {
          await db.daily_fee_rates.update({
            where: { id: rate_id },
            data: {
              feeding_rate: feeding_rate || 0,
              breakfast_rate: breakfast_rate || 0,
              classes_rate: classes_rate || 0,
              water_rate: water_rate || 0,
            },
          });
          updated++;
        } else {
          await db.daily_fee_rates.upsert({
            where: {
              id: 0, // force create
            },
            create: {
              class_id,
              feeding_rate: feeding_rate || 0,
              breakfast_rate: breakfast_rate || 0,
              classes_rate: classes_rate || 0,
              water_rate: water_rate || 0,
              year,
              term,
            },
            update: {
              feeding_rate: feeding_rate || 0,
              breakfast_rate: breakfast_rate || 0,
              classes_rate: classes_rate || 0,
              water_rate: water_rate || 0,
            },
          });
          created++;
        }
      }

      return NextResponse.json({
        status: 'success',
        message: `Rates saved (${created} created, ${updated} updated)`,
      });
    }

    // Single rate create
    const { class_id, feeding_rate, breakfast_rate, classes_rate, water_rate } = body;
    if (!class_id) {
      return NextResponse.json({ error: 'class_id required' }, { status: 400 });
    }

    // Check if rate exists for this class/year/term
    const existing = await db.daily_fee_rates.findFirst({
      where: { class_id, year, term },
    });

    if (existing) {
      await db.daily_fee_rates.update({
        where: { id: existing.id },
        data: {
          feeding_rate: feeding_rate || 0,
          breakfast_rate: breakfast_rate || 0,
          classes_rate: classes_rate || 0,
          water_rate: water_rate || 0,
        },
      });
      return NextResponse.json({ status: 'success', message: 'Rates updated', id: existing.id });
    }

    const rate = await db.daily_fee_rates.create({
      data: {
        class_id,
        feeding_rate: feeding_rate || 0,
        breakfast_rate: breakfast_rate || 0,
        classes_rate: classes_rate || 0,
        water_rate: water_rate || 0,
        year,
        term,
      },
    });

    return NextResponse.json({ status: 'success', message: 'Rates created', id: rate.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/daily-fees/rates - Update a rate
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, feeding_rate, breakfast_rate, classes_rate, water_rate } = body;
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    await db.daily_fee_rates.update({
      where: { id },
      data: {
        feeding_rate: feeding_rate || 0,
        breakfast_rate: breakfast_rate || 0,
        classes_rate: classes_rate || 0,
        water_rate: water_rate || 0,
      },
    });

    return NextResponse.json({ status: 'success', message: 'Rates updated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
