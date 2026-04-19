import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getSetting } from '@/lib/settings';
import crypto from 'crypto';

// ── Helpers ──
function generateStudentCode(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `STU${year}${random}`;
}

/**
 * GET /api/admin/students
 *
 * List students for the admin all_students page.
 * Matches CI3 Admin::all_students functionality.
 *
 * Query params:
 *   classId     - optional: filter by class_id
 *   sectionId   - optional: filter by section_id
 *   search      - optional: search student name or code
 *   gender      - optional: male / female
 *   residence   - optional: Day / Boarding
 *   activeStatus - optional: 1 (active) or 0 (inactive)
 *   page        - pagination page (default 1)
 *   limit       - items per page (default 50)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const classId = searchParams.get('classId');
    const sectionId = searchParams.get('sectionId');
    const search = searchParams.get('search') || '';
    const gender = searchParams.get('gender') || '';
    const residence = searchParams.get('residence') || '';
    const activeStatus = searchParams.get('activeStatus') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get running year/term from settings
    const running_year = await getSetting('running_year') || String(new Date().getFullYear());
    const running_term = await getSetting('running_term') || '1';

    // Build enroll where clause
    const enrollWhere: Record<string, unknown> = {
      mute: 0,
    };

    // Try to match year/term if there's data
    const hasYearTerm = await db.enroll.findFirst({
      where: { year: { not: '' } },
      select: { year: true },
    });
    if (hasYearTerm) {
      enrollWhere.year = running_year;
    }

    if (classId && classId !== '__all__') {
      enrollWhere.class_id = parseInt(classId);
    }
    if (sectionId && sectionId !== '__all__') {
      enrollWhere.section_id = parseInt(sectionId);
    }
    if (residence) {
      enrollWhere.residence_type = residence;
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
    if (gender) {
      studentWhere.sex = gender;
    }
    if (activeStatus !== '') {
      studentWhere.active_status = parseInt(activeStatus);
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
            address: true,
            birthday: true,
            active_status: true,
            admission_date: true,
            parent_id: true,
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
      orderBy: [
        { class: { name_numeric: 'asc' } },
        { roll: 'asc' },
      ],
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

    // Calculate stats from all enrolled students (not just current page)
    const allEnrolls = await db.enroll.findMany({
      where: enrollWhere,
      include: {
        student: { select: { sex: true, active_status: true } },
      },
    });

    const males = allEnrolls.filter(e => {
      const s = e.student?.sex?.toLowerCase();
      return s === 'male' && e.student?.active_status === 1;
    }).length;
    const females = allEnrolls.filter(e => {
      const s = e.student?.sex?.toLowerCase();
      return s === 'female' && e.student?.active_status === 1;
    }).length;
    const unknownGender = allEnrolls.filter(e => {
      const s = e.student?.sex?.toLowerCase();
      return s !== 'male' && s !== 'female' && e.student?.active_status === 1;
    }).length;
    const totalActive = allEnrolls.filter(e => e.student?.active_status === 1).length;
    const totalInactive = allEnrolls.filter(e => e.student?.active_status === 0).length;

    // Group by class for display
    const classGroups: Record<string, typeof validEnrolls> = {};
    for (const e of validEnrolls) {
      const key = String(e.class.class_id);
      if (!classGroups[key]) classGroups[key] = [];
      classGroups[key].push(e);
    }

    const students = validEnrolls.map(e => ({
      enroll_id: e.enroll_id,
      student_id: e.student.student_id,
      student_code: e.student.student_code,
      name: e.student.name,
      first_name: e.student.first_name,
      last_name: e.student.last_name,
      sex: e.student.sex,
      phone: e.student.phone,
      email: e.student.email,
      address: e.student.address,
      birthday: e.student.birthday,
      active_status: e.student.active_status,
      admission_date: e.student.admission_date,
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
      classGroups: Object.fromEntries(
        Object.entries(classGroups).map(([id, enrolls]) => [
          id,
          {
            class_id: parseInt(id),
            class_name: enrolls[0]?.class.name || '',
            class_name_numeric: enrolls[0]?.class.name_numeric || 0,
            students: enrolls.map(e => ({
              enroll_id: e.enroll_id,
              student_id: e.student.student_id,
              student_code: e.student.student_code,
              name: e.student.name,
              sex: e.student.sex,
              phone: e.student.phone,
              address: e.student.address,
              birthday: e.student.birthday,
              active_status: e.student.active_status,
              residence_type: e.residence_type,
              class_id: e.class.class_id,
              class_name: e.class.name,
              class_name_numeric: e.class.name_numeric,
              section_id: e.section.section_id,
              section_name: e.section.name,
              parent: e.parent,
              roll: e.roll,
            })),
          },
        ])
      ),
      stats: {
        males,
        females,
        unknownGender,
        totalActive,
        totalInactive,
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
 * POST /api/admin/students
 *
 * Create a new student with enrollment.
 * Matches CI3 Admin::student('create') functionality.
 *
 * Accepts full student payload including personal, academic,
 * guardian, and medical fields. Creates student record and
 * enrollment in a single transaction.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      first_name, middle_name, last_name, sex, religion, blood_group, birthday,
      nationality, address, phone, student_phone, email, admission_date,
      parent_id, class_id, section_id, year, term, roll, residence_type,
      username, password, special_needs, ghana_card_id, place_of_birth,
      hometown, tribe, emergency_contact, allergies, medical_conditions,
      nhis_number, nhis_status, disability_status, special_diet,
      student_special_diet_details, former_school, class_reached, student_code,
      father_name, father_phone, mother_name, mother_phone, parent_email,
    } = body;

    // Basic validation
    if (!first_name?.trim() || !last_name?.trim()) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }
    if (!class_id || !section_id) {
      return NextResponse.json(
        { error: 'Class and section are required' },
        { status: 400 }
      );
    }

    const name = [first_name, middle_name, last_name].filter(Boolean).join(' ').toUpperCase();

    // Generate 5-char authentication key
    const authKey = crypto.randomBytes(3).toString('hex').substring(0, 5).toUpperCase();

    // Resolve year/term from settings if not provided
    const running_year = year || await getSetting('running_year') || String(new Date().getFullYear());
    const running_term = term || await getSetting('running_term') || '';

    // Create the student record
    const student = await db.student.create({
      data: {
        first_name: first_name || '',
        middle_name: middle_name || '',
        last_name: last_name || '',
        name,
        sex: sex || '',
        religion: religion || '',
        blood_group: blood_group || '',
        birthday: birthday ? new Date(birthday) : null,
        nationality: nationality || 'Ghanaian',
        address: address || '',
        phone: phone || '',
        student_phone: student_phone || '',
        email: email || '',
        admission_date: admission_date ? new Date(admission_date) : new Date(),
        parent_id: parent_id || null,
        username: username || student_code || generateStudentCode(),
        password: password || '',
        special_needs: special_needs || '',
        student_code: student_code || generateStudentCode(),
        ghana_card_id: ghana_card_id || '',
        place_of_birth: place_of_birth || '',
        hometown: hometown || '',
        tribe: tribe || '',
        emergency_contact: emergency_contact || '',
        allergies: allergies || '',
        medical_conditions: medical_conditions || '',
        nhis_number: nhis_number || '',
        nhis_status: nhis_status || 'inactive',
        disability_status: disability_status ? 1 : 0,
        special_diet: special_diet ? 1 : 0,
        student_special_diet_details: student_special_diet_details || '',
        former_school: former_school || '',
        class_reached: class_reached || '',
        authentication_key: authKey,
        active_status: 1,
        mute: 0,
      },
    });

    // Create enrollment record
    await db.enroll.create({
      data: {
        student_id: student.student_id,
        class_id: parseInt(class_id),
        section_id: parseInt(section_id),
        year: running_year,
        term: running_term,
        roll: roll || '',
        residence_type: residence_type || 'Day',
        parent_id: parent_id ? parseInt(parent_id as string) : null,
        mute: 0,
      },
    });

    // Update parent record with father/mother info if parent_id provided
    if (parent_id) {
      const parentUpdate: Record<string, string> = {};
      if (father_name) parentUpdate.father_name = father_name;
      if (father_phone) parentUpdate.father_phone = father_phone;
      if (mother_name) parentUpdate.mother_name = mother_name;
      if (mother_phone) parentUpdate.mother_phone = mother_phone;
      if (phone) parentUpdate.phone = phone;
      if (parent_email) parentUpdate.email = parent_email;

      if (Object.keys(parentUpdate).length > 0) {
        await db.parent.update({
          where: { parent_id: parseInt(parent_id as string) },
          data: parentUpdate,
        });
      }
    }

    return NextResponse.json(
      { student_id: student.student_id, student_code: student.student_code, name: student.name },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating student (admin):', error);
    const message = error instanceof Error && error.message.includes('Unique')
      ? 'A student with this username or student code already exists'
      : 'Failed to create student';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/students
 *
 * Bulk delete students (matches CI3 Admin::bulk_students_delete)
 * Body: { studentIds: number[] }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentIds } = body;

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
