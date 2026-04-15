import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/discounts/assignments - List assignments with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || '';
    const term = searchParams.get('term') || '';
    const profileId = searchParams.get('profile_id') || '';
    const studentId = searchParams.get('student_id') || '';

    const where: any = {};
    if (year) where.year = year;
    if (term) where.term = term;
    if (profileId) where.profile_id = parseInt(profileId);
    if (studentId) where.student_id = parseInt(studentId);

    const assignments = await db.student_discount_assignments.findMany({
      where,
      include: {
        student: { select: { student_id: true, name: true, student_code: true } },
        profile: { select: { profile_id: true, profile_name: true, discount_category: true, flat_amount: true, flat_percentage: true } },
      },
      orderBy: { assignment_id: 'desc' },
    });

    // Get filter options
    const settings = await db.settings.findMany({
      where: { type: { in: ['running_year', 'running_term'] } },
    });
    let runningYear = '', runningTerm = '';
    settings.forEach((s: any) => {
      if (s.type === 'running_year') runningYear = s.description;
      if (s.type === 'running_term') runningTerm = s.description;
    });

    const profiles = await db.discount_profiles.findMany({
      where: { is_active: 1 },
      select: { profile_id: true, profile_name: true },
      orderBy: { profile_name: 'asc' },
    });

    // Get unique years and terms from assignments
    const allAssignments = await db.student_discount_assignments.findMany({
      select: { year: true, term: true },
      distinct: ['year', 'term'],
    });

    const years = [...new Set(allAssignments.map((a: any) => a.year).filter(Boolean))];
    const terms = [...new Set(allAssignments.map((a: any) => a.term).filter(Boolean))];

    return NextResponse.json({
      assignments,
      profiles,
      years,
      terms,
      runningYear,
      runningTerm,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/discounts/assignments - Create assignment (single or bulk)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || 'single';

    const settings = await db.settings.findMany({
      where: { type: { in: ['running_year', 'running_term'] } },
    });
    let year = '', term = '';
    settings.forEach((s: any) => {
      if (s.type === 'running_year') year = s.description;
      if (s.type === 'running_term') term = s.description;
    });

    if (action === 'bulk') {
      const { student_ids, profile_id, discount_category } = body;
      if (!Array.isArray(student_ids) || student_ids.length === 0 || !profile_id) {
        return NextResponse.json({ error: 'student_ids and profile_id required' }, { status: 400 });
      }

      let created = 0;
      for (const sid of student_ids) {
        // Check for existing assignment
        const existing = await db.student_discount_assignments.findFirst({
          where: { student_id: sid, year, term, profile_id },
        });
        if (!existing) {
          await db.student_discount_assignments.create({
            data: {
              student_id: sid,
              profile_id,
              discount_category: discount_category || '',
              year,
              term,
              is_active: 1,
            },
          });
          created++;
        }
      }

      return NextResponse.json({
        status: 'success',
        message: `${created} assignments created (${student_ids.length - created} already assigned)`,
      });
    }

    // Single assignment
    const { student_id, profile_id, discount_category } = body;
    if (!student_id || !profile_id) {
      return NextResponse.json({ error: 'student_id and profile_id required' }, { status: 400 });
    }

    // Check for existing
    const existing = await db.student_discount_assignments.findFirst({
      where: { student_id, year, term },
    });

    if (existing) {
      await db.student_discount_assignments.update({
        where: { assignment_id: existing.assignment_id },
        data: { profile_id, discount_category: discount_category || '' },
      });
      return NextResponse.json({ status: 'success', message: 'Assignment updated' });
    }

    await db.student_discount_assignments.create({
      data: {
        student_id,
        profile_id,
        discount_category: discount_category || '',
        year,
        term,
        is_active: 1,
      },
    });

    return NextResponse.json({ status: 'success', message: 'Assignment created' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/discounts/assignments - Toggle status or edit assignment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'bulk_toggle') {
      const { ids } = body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: 'No items selected' }, { status: 400 });
      }
      for (const id of ids) {
        const current = await db.student_discount_assignments.findUnique({ where: { assignment_id: id } });
        if (current) {
          await db.student_discount_assignments.update({
            where: { assignment_id: id },
            data: { is_active: current.is_active ? 0 : 1 },
          });
        }
      }
      return NextResponse.json({ status: 'success', message: 'Bulk toggle successful' });
    }

    // Edit assignment - change profile
    const { assignment_id, profile_id } = body;
    if (!assignment_id || !profile_id) {
      return NextResponse.json({ error: 'assignment_id and profile_id required' }, { status: 400 });
    }

    await db.student_discount_assignments.update({
      where: { assignment_id },
      data: { profile_id: parseInt(profile_id) },
    });

    return NextResponse.json({ status: 'success', message: 'Assignment updated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/discounts/assignments - Remove assignment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assignmentId = parseInt(searchParams.get('id') || '0');
    const action = searchParams.get('action') || 'delete';

    if (!assignmentId) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    if (action === 'toggle') {
      const current = await db.student_discount_assignments.findUnique({ where: { assignment_id } });
      if (current) {
        await db.student_discount_assignments.update({
          where: { assignment_id },
          data: { is_active: current.is_active ? 0 : 1 },
        });
        return NextResponse.json({ status: 'success', message: current.is_active ? 'Discount deactivated' : 'Discount activated' });
      }
    }

    await db.student_discount_assignments.delete({ where: { assignment_id: assignmentId } });

    return NextResponse.json({ status: 'success', message: 'Assignment removed' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
