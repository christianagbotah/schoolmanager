import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/alumni
 *
 * List alumni/old students.
 * Matches CI3 Admin::load_alumni (server-side DataTable).
 *
 * Query params:
 *   search  - optional: search name, code, email
 *   yearBatch - optional: filter by graduation year/batch
 *   page    - pagination page (default 1)
 *   limit   - items per page (default 50)
 *   sort    - sort column (default: name)
 *   dir     - sort direction (asc/desc, default: asc)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const yearBatch = searchParams.get('yearBatch') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sort = searchParams.get('sort') || 'name';
    const dir = searchParams.get('dir') || 'asc';

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { address: { contains: search } },
      ];
    }

    if (yearBatch) {
      where.graduation_year = yearBatch;
    }

    // Determine sort field mapping
    const sortField: Record<string, string> = {
      name: 'name',
      graduation_year: 'graduation_year',
      email: 'email',
      student_id: 'alumni_id',
    };

    const orderByField = sortField[sort] || 'name';
    const skip = (page - 1) * limit;

    // Fetch alumni records
    const alumniRecords = await db.alumni.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { [orderByField]: dir === 'desc' ? 'desc' : 'asc' },
      skip,
      take: limit,
    });

    // Get total count
    const total = await db.alumni.count({
      where: Object.keys(where).length > 0 ? where : undefined,
    });

    // Get distinct graduation years for filter dropdown
    const distinctYears = await db.alumni.findMany({
      distinct: ['graduation_year'],
      where: { graduation_year: { not: '' } },
      orderBy: { graduation_year: 'desc' },
      select: { graduation_year: true },
    });

    const result = alumniRecords.map(a => ({
      alumni_id: a.alumni_id,
      student_id: a.student_id,
      name: a.name,
      email: a.email,
      phone: a.phone,
      address: a.address,
      graduation_year: a.graduation_year,
      current_occupation: a.current_occupation,
      is_active: a.is_active,
      created_at: a.created_at,
    }));

    return NextResponse.json({
      students: result,
      total,
      filters: {
        years: distinctYears.map(y => y.graduation_year).filter(Boolean),
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching alumni:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alumni' },
      { status: 500 }
    );
  }
}
