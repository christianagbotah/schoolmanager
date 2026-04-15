import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// This route extends the existing rates route with additional
// management features for the rates page sub-route.

// GET /api/admin/daily-fees/rates - handled by the existing route
// POST /api/admin/daily-fees/rates - handled by the existing route

// We add a PUT for updating rates by class and DELETE for removing rates
// These will be handled by the existing route file, so this file
// provides supplementary endpoints.

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

    // Calculate transport fares per class from transport table
    const transportFares = await db.transport.findMany();
    const transportMap: Record<number, number> = {};
    transportFares.forEach(t => {
      transportMap[t.transport_id] = t.fare;
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
