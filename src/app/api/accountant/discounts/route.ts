import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/accountant/discounts - Discount management from accountant perspective
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Discount profiles
    const profileWhere: Record<string, unknown> = {};
    if (search) profileWhere.profile_name = { contains: search };
    if (category) profileWhere.discount_category = category;
    if (status === '1') profileWhere.is_active = 1;
    if (status === '0') profileWhere.is_active = 0;

    const [profiles, assignmentCount] = await Promise.all([
      db.discount_profiles.findMany({
        where: Object.keys(profileWhere).length > 0 ? profileWhere : undefined,
        orderBy: { profile_id: 'desc' },
      }),
      db.student_discount_assignments.count(),
    ]);

    // Student discount assignments
    const assignWhere: Record<string, unknown> = {};
    if (search) {
      assignWhere.OR = [
        { student: { name: { contains: search } } },
        { student: { student_code: { contains: search } } },
      ];
    }

    const [assignments, totalAssignments] = await Promise.all([
      db.student_discount_assignments.findMany({
        where: Object.keys(assignWhere).length > 0 ? assignWhere : undefined,
        include: {
          student: { select: { student_id: true, name: true, student_code: true } },
          profile: { select: { profile_name: true, discount_type: true, flat_amount: true, flat_percentage: true } },
        },
        orderBy: { assignment_id: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.student_discount_assignments.count({ where: Object.keys(assignWhere).length > 0 ? assignWhere : undefined }),
    ]);

    // Discount categories
    const categories = await db.discount_categories.findMany({
      where: { is_active: 1 },
    });

    // Stats
    const activeProfiles = profiles.filter(p => p.is_active === 1).length;
    const invoiceDiscounts = profiles.filter(p => p.discount_category === 'invoice').length;
    const dailyFeeDiscounts = profiles.filter(p => p.discount_category === 'daily_fees').length;
    const totalFlatAmount = profiles.reduce((s, p) => s + (p.flat_amount || 0), 0);

    // Applied discounts on invoices (total discount given)
    const invoiceDiscountTotal = await db.invoice.aggregate({
      _sum: { discount: true },
      _count: true,
    });

    return NextResponse.json({
      profiles,
      assignments,
      categories,
      pagination: { page, limit, total: totalAssignments, totalPages: Math.ceil(totalAssignments / limit) },
      stats: {
        totalProfiles: profiles.length,
        activeProfiles,
        totalAssignments: assignmentCount,
        invoiceDiscounts,
        dailyFeeDiscounts,
        totalFlatAmount,
        totalInvoiceDiscount: invoiceDiscountTotal._sum.discount || 0,
        invoicesWithDiscount: await db.invoice.count({ where: { discount: { gt: 0 } } }),
      },
    });
  } catch (error: any) {
    console.error('Error fetching discounts:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch discounts' }, { status: 500 });
  }
}

// POST /api/accountant/discounts - Approve/reject discount request
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { assignmentId, action, studentId, profileId, year, term } = body;

    // Approve/reject action
    if (assignmentId && action) {
      if (action === 'activate') {
        await db.student_discount_assignments.update({
          where: { assignment_id: parseInt(assignmentId) },
          data: { is_active: 1 },
        });
        return NextResponse.json({ success: true, message: 'Discount activated' });
      }
      if (action === 'deactivate') {
        await db.student_discount_assignments.update({
          where: { assignment_id: parseInt(assignmentId) },
          data: { is_active: 0 },
        });
        return NextResponse.json({ success: true, message: 'Discount deactivated' });
      }
      if (action === 'delete') {
        await db.student_discount_assignments.delete({
          where: { assignment_id: parseInt(assignmentId) },
        });
        return NextResponse.json({ success: true, message: 'Discount assignment removed' });
      }
    }

    // Create new assignment
    if (studentId && profileId) {
      const student = await db.student.findUnique({ where: { student_id: parseInt(studentId) } });
      if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

      const profile = await db.discount_profiles.findUnique({ where: { profile_id: parseInt(profileId) } });
      if (!profile) return NextResponse.json({ error: 'Discount profile not found' }, { status: 404 });

      const assignment = await db.student_discount_assignments.create({
        data: {
          student_id: parseInt(studentId),
          profile_id: parseInt(profileId),
          discount_category: profile.discount_category || '',
          year: year || '',
          term: term || '',
          is_active: 1,
        },
      });

      return NextResponse.json({ success: true, message: 'Discount assigned', assignment }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Discount action error:', error);
    return NextResponse.json({ error: error.message || 'Action failed' }, { status: 500 });
  }
}
