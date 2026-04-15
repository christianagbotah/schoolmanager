import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/special-diet
 *
 * List students on special diet.
 * Matches CI3 Admin::student_on_special_diet view.
 *
 * Query params:
 *   search  - optional: search student name or code
 *   classGroup - optional: filter by class category (CRECHE/NURSERY/KG/BASIC/JHS)
 *   page    - pagination page (default 1)
 *   limit   - items per page (default 50)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const classGroup = searchParams.get('classGroup') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get running year for filtering enrollments
    const runningYearSetting = await db.settings.findFirst({
      where: { type: 'running_year' },
    });
    const runningYear = runningYearSetting?.description || new Date().getFullYear().toString();

    // Build student where clause
    const studentWhere: Record<string, unknown> = {
      special_diet: 1,
    };

    if (search) {
      studentWhere.OR = [
        { name: { contains: search } },
        { student_code: { contains: search } },
        { first_name: { contains: search } },
        { last_name: { contains: search } },
        { address: { contains: search } },
      ];
    }

    // Build enroll where clause
    const enrollWhere: Record<string, unknown> = {
      year: runningYear,
    };

    if (classGroup) {
      enrollWhere.class = { category: classGroup };
    }

    const skip = (page - 1) * limit;

    // Fetch students with their latest enrollment in the running year
    const enrolls = await db.enroll.findMany({
      where: {
        ...enrollWhere,
        student: studentWhere,
      },
      include: {
        student: {
          select: {
            student_id: true,
            student_code: true,
            name: true,
            sex: true,
            address: true,
            special_diet: true,
            student_special_diet_details: true,
          },
        },
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
      orderBy: { student: { name: 'asc' } },
      skip,
      take: limit,
    });

    // Deduplicate by student_id (a student may have multiple enrollments)
    const seen = new Set<number>();
    const uniqueEnrolls = enrolls.filter(e => {
      if (seen.has(e.student.student_id)) return false;
      seen.add(e.student.student_id);
      return true;
    });

    // Get total count
    const totalStudents = await db.student.count({
      where: studentWhere,
    });

    const students = uniqueEnrolls.map(e => ({
      student_id: e.student.student_id,
      student_code: e.student.student_code,
      name: e.student.name,
      sex: e.student.sex,
      address: e.student.address,
      diet_details: e.student.student_special_diet_details || '',
      class_id: e.class.class_id,
      class_name: e.class.name,
      class_category: e.class.category,
      section_id: e.section.section_id,
      section_name: e.section.name,
    }));

    return NextResponse.json({
      students,
      total: totalStudents,
      pagination: {
        page,
        limit,
        total: students.length,
        totalPages: Math.ceil(totalStudents / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching special diet students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch special diet students' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/special-diet
 *
 * Add a student to special diet or update diet details.
 * Body: { student_id: number, diet_details?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, diet_details } = body;

    if (!student_id) {
      return NextResponse.json(
        { error: 'student_id is required' },
        { status: 400 }
      );
    }

    const student = await db.student.update({
      where: { student_id: parseInt(student_id) },
      data: {
        special_diet: 1,
        ...(diet_details !== undefined ? { student_special_diet_details: diet_details } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Student added to special diet',
      student_id: student.student_id,
    });
  } catch (error) {
    console.error('Error adding student to special diet:', error);
    return NextResponse.json(
      { error: 'Failed to add student to special diet' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/special-diet
 *
 * Remove a student from special diet.
 * Body: { student_id: number }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id } = body;

    if (!student_id) {
      return NextResponse.json(
        { error: 'student_id is required' },
        { status: 400 }
      );
    }

    await db.student.update({
      where: { student_id: parseInt(student_id) },
      data: {
        special_diet: 0,
        student_special_diet_details: '',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Student removed from special diet',
    });
  } catch (error) {
    console.error('Error removing student from special diet:', error);
    return NextResponse.json(
      { error: 'Failed to remove student from special diet' },
      { status: 500 }
    );
  }
}
