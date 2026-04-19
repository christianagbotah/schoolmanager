import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/daily-fees/rates - List rates grouped by category
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || '';
    const term = searchParams.get('term') || '';

    // Get running year/term
    const settings = await db.settings.findMany({
      where: { type: { in: ['running_year', 'running_term'] } },
    });
    let filterYear = year;
    let filterTerm = term;
    settings.forEach((s: any) => {
      if (s.type === 'running_year') filterYear = s.description;
      if (s.type === 'running_term') filterTerm = s.description;
    });

    const rates = await db.daily_fee_rates.findMany({
      where: { year: filterYear, term: filterTerm },
      include: { class: { select: { class_id: true, name: true, name_numeric: true, category: true } } },
      orderBy: { id: 'asc' },
    });

    const classes = await db.school_class.findMany({
      orderBy: [{ category: 'asc' }, { name_numeric: 'asc' }, { name: 'asc' }],
    });

    // Group rates by category
    const categories = [...new Set(classes.map(c => c.category).filter(Boolean))];
    const groupedRates = categories.map(cat => {
      const catClasses = classes.filter(c => c.category === cat);
      return {
        category: cat,
        classes: catClasses.map(cls => {
          const rate = rates.find(r => r.class_id === cls.class_id);
          return {
            class_id: cls.class_id,
            class_name: `${cls.name} ${cls.name_numeric}`,
            category: cls.category,
            hasRates: !!rate,
            feeding_rate: rate?.feeding_rate || 0,
            breakfast_rate: rate?.breakfast_rate || 0,
            classes_rate: rate?.classes_rate || 0,
            water_rate: rate?.water_rate || 0,
            total_rate: rate ? (rate.feeding_rate + rate.breakfast_rate + rate.classes_rate + rate.water_rate) : 0,
          };
        }),
      };
    });

    return NextResponse.json({
      rates,
      classes,
      categories: groupedRates,
      year: filterYear,
      term: filterTerm,
      stats: {
        totalClasses: classes.length,
        classesWithRates: rates.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/daily-fees/rates - Save single or bulk rates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, class_id, feeding_rate, breakfast_rate, classes_rate, water_rate, items } = body;

    // Get running year/term
    const settings = await db.settings.findMany({
      where: { type: { in: ['running_year', 'running_term'] } },
    });
    let year = '', term = '';
    settings.forEach((s: any) => {
      if (s.type === 'running_year') year = s.description;
      if (s.type === 'running_term') term = s.description;
    });

    // Bulk save
    if (action === 'bulk' && Array.isArray(items)) {
      let saved = 0;
      for (const item of items) {
        const cid = item.class_id || item.rate_id;
        if (!cid) continue;

        // Check if rate exists
        const existing = await db.daily_fee_rates.findFirst({
          where: { class_id: cid, year, term },
        });

        if (existing) {
          await db.daily_fee_rates.update({
            where: { id: existing.id },
            data: {
              feeding_rate: item.feeding_rate || 0,
              breakfast_rate: item.breakfast_rate || 0,
              classes_rate: item.classes_rate || 0,
              water_rate: item.water_rate || 0,
            },
          });
        } else {
          await db.daily_fee_rates.create({
            data: {
              class_id: cid,
              feeding_rate: item.feeding_rate || 0,
              breakfast_rate: item.breakfast_rate || 0,
              classes_rate: item.classes_rate || 0,
              water_rate: item.water_rate || 0,
              year,
              term,
            },
          });
        }
        saved++;
      }
      return NextResponse.json({
        status: 'success',
        message: `${saved} class rates saved successfully`,
      });
    }

    // Single save
    if (!class_id) {
      return NextResponse.json({ error: 'class_id is required' }, { status: 400 });
    }

    const existing = await db.daily_fee_rates.findFirst({
      where: { class_id, year, term },
    });

    if (existing) {
      const updated = await db.daily_fee_rates.update({
        where: { id: existing.id },
        data: {
          feeding_rate: feeding_rate || 0,
          breakfast_rate: breakfast_rate || 0,
          classes_rate: classes_rate || 0,
          water_rate: water_rate || 0,
        },
      });
      return NextResponse.json({
        status: 'success',
        message: 'Rates updated successfully',
        rate: updated,
      });
    } else {
      const created = await db.daily_fee_rates.create({
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
      return NextResponse.json({
        status: 'success',
        message: 'Rates created successfully',
        rate: created,
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
