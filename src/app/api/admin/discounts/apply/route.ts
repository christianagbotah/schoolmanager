import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/discounts/apply - Get profiles list and running year/term for apply page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const settings = await db.settings.findMany({
      where: { type: { in: ['running_year', 'running_term'] } },
    });
    let runningYear = '';
    let runningTerm = '';
    settings.forEach((s: any) => {
      if (s.type === 'running_year') runningYear = s.description;
      if (s.type === 'running_term') runningTerm = s.description;
    });

    const where: any = { is_active: 1 };
    if (search) where.profile_name = { contains: search };

    const profiles = await db.discount_profiles.findMany({
      where,
      orderBy: { profile_id: 'desc' },
    });

    // Get recent assignments
    const recentAssignments = await db.student_discount_assignments.findMany({
      take: 20,
      include: {
        student: { select: { student_id: true, name: true, student_code: true } },
        profile: { select: { profile_id: true, profile_name: true, flat_amount: true, flat_percentage: true } },
      },
      orderBy: { assignment_id: 'desc' },
    });

    const assignmentCount = await db.student_discount_assignments.count();
    const activeAssignments = await db.student_discount_assignments.count({ where: { is_active: 1 } });

    return NextResponse.json({
      profiles,
      recentAssignments,
      runningYear,
      runningTerm,
      stats: {
        total: assignmentCount,
        active: activeAssignments,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/discounts/apply - Apply discount to student(s)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_ids, profile_id, discount_category, reason, effective_date, action } = body;

    if (action === 'search_student') {
      const { query } = body;
      if (!query || query.length < 2) {
        return NextResponse.json({ students: [] });
      }
      const students = await db.student.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { student_code: { contains: query } },
          ],
          active_status: 1,
        },
        select: { student_id: true, name: true, student_code: true },
        take: 15,
      });
      return NextResponse.json({ students });
    }

    if (action === 'apply') {
      if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
        return NextResponse.json({ error: 'Select at least one student' }, { status: 400 });
      }
      if (!profile_id) {
        return NextResponse.json({ error: 'Select a discount profile' }, { status: 400 });
      }

      const settings = await db.settings.findMany({
        where: { type: { in: ['running_year', 'running_term'] } },
      });
      let runningYear = '';
      let runningTerm = '';
      settings.forEach((s: any) => {
        if (s.type === 'running_year') runningYear = s.description;
        if (s.type === 'running_term') runningTerm = s.description;
      });

      const profile = await db.discount_profiles.findUnique({ where: { profile_id } });
      if (!profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }

      let created = 0;
      let skipped = 0;

      for (const studentId of student_ids) {
        // Check if assignment already exists
        const existing = await db.student_discount_assignments.findFirst({
          where: {
            student_id: studentId,
            profile_id: profile_id,
            year: runningYear,
            term: runningTerm,
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        await db.student_discount_assignments.create({
          data: {
            student_id: studentId,
            profile_id: profile_id,
            discount_category: discount_category || profile.discount_category,
            year: runningYear,
            term: runningTerm,
            is_active: 1,
          },
        });
        created++;
      }

      return NextResponse.json({
        status: 'success',
        message: `Discount applied to ${created} student(s)${skipped > 0 ? `, ${skipped} skipped (already assigned)` : ''}`,
        created,
        skipped,
      });
    }

    if (action === 'remove') {
      const { assignment_id } = body;
      if (!assignment_id) {
        return NextResponse.json({ error: 'assignment_id required' }, { status: 400 });
      }

      await db.student_discount_assignments.delete({
        where: { assignment_id },
      });

      return NextResponse.json({ status: 'success', message: 'Discount removed' });
    }

    if (action === 'toggle') {
      const { assignment_id } = body;
      if (!assignment_id) {
        return NextResponse.json({ error: 'assignment_id required' }, { status: 400 });
      }

      const assignment = await db.student_discount_assignments.findUnique({ where: { assignment_id } });
      if (!assignment) {
        return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
      }

      await db.student_discount_assignments.update({
        where: { assignment_id },
        data: { is_active: assignment.is_active ? 0 : 1 },
      });

      return NextResponse.json({ status: 'success', message: assignment.is_active ? 'Discount deactivated' : 'Discount activated' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/discounts/apply - Remove discount assignment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assignmentId = parseInt(searchParams.get('id') || '0');

    if (!assignmentId) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    await db.student_discount_assignments.delete({ where: { assignment_id: assignmentId } });
    return NextResponse.json({ status: 'success', message: 'Discount removed' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
