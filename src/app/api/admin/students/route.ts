import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/students
 * 
 * List students for the admin student_information page.
 * Matches CI3 Admin::student_information + get_students functionality.
 * 
 * Query params:
 *   classId   - required: filter by class_id (enroll table)
 *   sectionId - optional: filter by section_id
 *   search    - optional: search student name or code
 *   page      - pagination page (default 1)
 *   limit     - items per page (default 20)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const classId = searchParams.get('classId');
    const sectionId = searchParams.get('sectionId');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!classId) {
      return NextResponse.json(
        { error: 'classId is required' },
        { status: 400 }
      );
    }

    // Build enroll where clause
    const enrollWhere: Record<string, unknown> = {
      class_id: parseInt(classId),
      mute: 0,
    };

    if (sectionId && sectionId !== '__all__') {
      enrollWhere.section_id = parseInt(sectionId);
    }

    // Build student where clause
    const studentWhere: Record<string, unknown> = {};
    if (search) {
      studentWhere.OR = [
        { name: { contains: search } },
        { student_code: { contains: search } },
        { first_name: { contains: search } },
        { last_name: { contains: search } },
      ];
    }

    const skip = (page - 1) * limit;

    // Fetch students with enrollment data
    const enrolls = await db.enroll.findMany({
      where: enrollWhere,
      include: {
        student: {
          where: Object.keys(studentWhere).length > 0 ? studentWhere : undefined,
          select: {
            student_id: true,
            student_code: true,
            name: true,
            first_name: true,
            last_name: true,
            sex: true,
            phone: true,
            email: true,
            authentication_key: true,
            active_status: true,
            address: true,
            birthday: true,
          },
        },
        class: {
          select: {
            class_id: true,
            name: true,
            name_numeric: true,
            category: true,
          },
        },
        section: {
          select: {
            section_id: true,
            name: true,
          },
        },
        parent: {
          select: {
            parent_id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { roll: 'asc' },
      skip,
      take: limit,
    });

    // Filter out null students (happens when search doesn't match)
    const validEnrolls = enrolls.filter(e => e.student !== null);

    // Get total count for pagination
    const total = await db.enroll.count({
      where: {
        ...enrollWhere,
        ...(Object.keys(studentWhere).length > 0 ? { student: studentWhere } : {}),
      },
    });

    // Calculate gender stats from all enrolled students in this class (not just current page)
    const allEnrolls = await db.enroll.findMany({
      where: enrollWhere,
      include: {
        student: { select: { sex: true } },
      },
    });

    const males = allEnrolls.filter(e => {
      const s = e.student?.sex?.toLowerCase();
      return s === 'male';
    }).length;
    const females = allEnrolls.filter(e => {
      const s = e.student?.sex?.toLowerCase();
      return s === 'female';
    }).length;
    const unsetGender = allEnrolls.filter(e => {
      const s = e.student?.sex?.toLowerCase();
      return s !== 'male' && s !== 'female';
    }).length;

    const students = validEnrolls.map(e => ({
      enroll_id: e.enroll_id,
      student_id: e.student.student_id,
      student_code: e.student.student_code,
      name: e.student.name,
      sex: e.student.sex,
      authentication_key: e.student.authentication_key,
      active_status: e.student.active_status,
      phone: e.student.phone,
      email: e.student.email,
      address: e.student.address,
      birthday: e.student.birthday,
      roll: e.roll,
      residence_type: e.residence_type,
      class_id: e.class.class_id,
      class_name: e.class.name,
      class_name_numeric: e.class.name_numeric,
      class_category: e.class.category,
      section_id: e.section.section_id,
      section_name: e.section.name,
      parent: e.parent,
    }));

    return NextResponse.json({
      students,
      stats: {
        males,
        females,
        unsetGender,
        total: allEnrolls.length,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching admin students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/students
 * 
 * Bulk delete students (matches CI3 Admin::bulk_students_delete)
 * Body: { studentIds: number[], classId: number }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentIds, classId } = body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: 'studentIds array is required' },
        { status: 400 }
      );
    }

    const ids = studentIds.map(Number);
    const deletedCount = await db.student.deleteMany({
      where: {
        student_id: { in: ids },
      },
    });

    return NextResponse.json({
      success: true,
      message: `${deletedCount.count} student(s) deleted successfully`,
      count: deletedCount.count,
    });
  } catch (error) {
    console.error('Error bulk deleting students:', error);
    return NextResponse.json(
      { error: 'Failed to delete students' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/students
 * 
 * Actions: block, unblock, mute, unmute, move, change_residence
 * Matches CI3 student account management actions.
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Block student account
    if (action === 'block') {
      const { student_id } = body;
      await db.student.update({
        where: { student_id: parseInt(student_id) },
        data: { active_status: 0 },
      });
      return NextResponse.json({ success: true, message: 'Student account blocked' });
    }

    // Unblock student account
    if (action === 'unblock') {
      const { student_id } = body;
      await db.student.update({
        where: { student_id: parseInt(student_id) },
        data: { active_status: 1 },
      });
      return NextResponse.json({ success: true, message: 'Student account unblocked' });
    }

    // Mute student (set enroll.mute = 1 for all enrollments)
    if (action === 'mute') {
      const { student_id } = body;
      await db.enroll.updateMany({
        where: { student_id: parseInt(student_id) },
        data: { mute: 1 },
      });
      return NextResponse.json({ success: true, message: 'Student muted' });
    }

    // Unmute student
    if (action === 'unmute') {
      const { student_id } = body;
      await db.enroll.updateMany({
        where: { student_id: parseInt(student_id) },
        data: { mute: 0 },
      });
      return NextResponse.json({ success: true, message: 'Student unmuted' });
    }

    // Move students to a different class/section
    if (action === 'move') {
      const { student_ids, to_class_id, to_section_id } = body;
      if (!student_ids || !to_class_id) {
        return NextResponse.json({ error: 'Missing move parameters' }, { status: 400 });
      }
      const ids = student_ids.map(Number);
      let moved = 0;
      for (const sid of ids) {
        // Get the latest enrollment for this student
        const latestEnroll = await db.enroll.findFirst({
          where: { student_id: sid },
          orderBy: { enroll_id: 'desc' },
        });
        if (latestEnroll) {
          await db.enroll.update({
            where: { enroll_id: latestEnroll.enroll_id },
            data: {
              class_id: parseInt(to_class_id),
              section_id: to_section_id ? parseInt(to_section_id) : latestEnroll.section_id,
            },
          });
          moved++;
        }
      }
      return NextResponse.json({ success: true, message: `${moved} student(s) moved`, count: moved });
    }

    // Change residence type for students
    if (action === 'change_residence') {
      const { student_ids, residence_type } = body;
      if (!student_ids || !residence_type) {
        return NextResponse.json({ error: 'Missing residence parameters' }, { status: 400 });
      }
      const ids = student_ids.map(Number);
      let updated = 0;
      for (const sid of ids) {
        const latestEnroll = await db.enroll.findFirst({
          where: { student_id: sid },
          orderBy: { enroll_id: 'desc' },
        });
        if (latestEnroll) {
          await db.enroll.update({
            where: { enroll_id: latestEnroll.enroll_id },
            data: { residence_type },
          });
          updated++;
        }
      }
      return NextResponse.json({ success: true, message: `${updated} student(s) updated`, count: updated });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Error in admin student PUT:', error);
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
}
