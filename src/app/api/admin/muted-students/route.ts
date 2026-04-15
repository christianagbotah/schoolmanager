import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/muted-students
 *
 * List muted/suspended students.
 * Matches CI3 Admin::muted_students view.
 *
 * Query params:
 *   search  - optional: search student name or code
 *   page    - pagination page (default 1)
 *   limit   - items per page (default 50)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get running year for filtering enrollments
    const runningYearSetting = await db.settings.findFirst({
      where: { type: 'running_year' },
    });
    const runningYear = runningYearSetting?.description || new Date().getFullYear().toString();

    // Build student where clause
    const studentWhere: Record<string, unknown> = {
      mute: 1,
    };

    if (search) {
      studentWhere.OR = [
        { name: { contains: search } },
        { student_code: { contains: search } },
        { email: { contains: search } },
        { first_name: { contains: search } },
        { last_name: { contains: search } },
      ];
    }

    const skip = (page - 1) * limit;

    // Fetch muted students with enrollment data
    const students = await db.student.findMany({
      where: studentWhere,
      select: {
        student_id: true,
        student_code: true,
        name: true,
        sex: true,
        address: true,
        email: true,
        phone: true,
        active_status: true,
        mute: true,
        enrolls: {
          where: { year: runningYear },
          select: {
            enroll_id: true,
            class_id: true,
            section_id: true,
            class: {
              select: {
                class_id: true,
                name: true,
                category: true,
              },
            },
            section: {
              select: {
                section_id: true,
                name: true,
              },
            },
          },
          take: 1,
          orderBy: { enroll_id: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    });

    // Get total count
    const total = await db.student.count({
      where: studentWhere,
    });

    const result = students.map(s => ({
      student_id: s.student_id,
      student_code: s.student_code,
      name: s.name,
      sex: s.sex,
      address: s.address,
      email: s.email,
      phone: s.phone,
      active_status: s.active_status,
      mute: s.mute,
      // Use latest enrollment data
      class_id: s.enrolls[0]?.class?.class_id || null,
      class_name: s.enrolls[0]?.class?.name || '—',
      class_category: s.enrolls[0]?.class?.category || '',
      section_id: s.enrolls[0]?.section?.section_id || null,
      section_name: s.enrolls[0]?.section?.name || '—',
    }));

    return NextResponse.json({
      students: result,
      total,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching muted students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch muted students' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/muted-students
 *
 * Unmute a student (set student.mute = 0).
 * Also unmutes all enroll records.
 * Body: { student_id: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, action } = body;

    if (!student_id) {
      return NextResponse.json(
        { error: 'student_id is required' },
        { status: 400 }
      );
    }

    if (action === 'unmute') {
      // Unmute student and all enrollments
      await db.student.update({
        where: { student_id: parseInt(student_id) },
        data: { mute: 0 },
      });

      await db.enroll.updateMany({
        where: { student_id: parseInt(student_id) },
        data: { mute: 0 },
      });

      return NextResponse.json({
        success: true,
        message: 'Student unmuted successfully',
      });
    }

    if (action === 'unblock') {
      // Unblock student account
      await db.student.update({
        where: { student_id: parseInt(student_id) },
        data: { active_status: 1 },
      });

      return NextResponse.json({
        success: true,
        message: 'Student unblocked successfully',
      });
    }

    return NextResponse.json(
      { error: 'Unknown action. Use "unmute" or "unblock".' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating muted student:', error);
    return NextResponse.json(
      { error: 'Operation failed' },
      { status: 500 }
    );
  }
}
