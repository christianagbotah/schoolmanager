import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/students/[id]
 * 
 * Fetch complete student profile data matching CI3 Admin::student_profile
 * Returns student info, enrollment, parent, exams, marks, invoices, payments
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const studentId = parseInt(id);

    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
    }

    // Fetch student with all profile relations
    const student = await db.student.findUnique({
      where: { student_id: studentId },
      include: {
        parent: {
          select: {
            parent_id: true,
            name: true,
            guardian_gender: true,
            email: true,
            phone: true,
            address: true,
            profession: true,
            father_name: true,
            father_phone: true,
            mother_name: true,
            mother_phone: true,
            authentication_key: true,
            active_status: true,
          },
        },
        enrolls: {
          include: {
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
          },
          orderBy: { enroll_id: 'desc' },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get latest enrollment for current status
    const latestEnroll = student.enrolls.find(e => e.mute === 0) || student.enrolls[0];
    const currentEnroll = student.enrolls.find(e => e.mute === 0);
    const classInfo = latestEnroll?.class;
    const sectionInfo = latestEnroll?.section;

    // Determine student status (ACTIVE / INACTIVE / COMPLETED)
    const lastEnroll = student.enrolls[0]; // most recent by enroll_id desc
    let status = 'INACTIVE';
    let statusColor = 'bg-gray-400';
    if (currentEnroll) {
      status = 'ACTIVE';
      statusColor = 'bg-green-500';
    } else if (lastEnroll) {
      const cn = lastEnroll.class?.name;
      const nn = lastEnroll.class?.name_numeric;
      const lt = lastEnroll.term;
      if (cn === 'JHS' && nn === 3 && lt === '3') {
        status = 'COMPLETED';
        statusColor = 'bg-blue-500';
      }
    }

    // Fetch class students (other_students for the selector)
    let otherStudents: { student_id: number; name: string; student_code: string }[] = [];
    if (latestEnroll) {
      const classMates = await db.enroll.findMany({
        where: {
          class_id: latestEnroll.class_id,
          mute: 0,
          student_id: { not: studentId },
        },
        include: {
          student: {
            select: { student_id: true, name: true, student_code: true },
          },
        },
        take: 200,
      });
      otherStudents = classMates
        .filter(c => c.student)
        .map(c => ({
          student_id: c.student.student_id,
          name: c.student.name,
          student_code: c.student.student_code,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    // Fetch exam marks - get all distinct exams this student has marks for
    const studentMarks = await db.mark.findMany({
      where: { student_id: studentId },
      include: {
        subject: {
          select: { subject_id: true, name: true },
        },
        exam: {
          select: {
            exam_id: true,
            name: true,
            year: true,
            date: true,
            type: true,
            class: {
              select: { class_id: true, name: true, name_numeric: true },
            },
          },
        },
        class: {
          select: { class_id: true, name: true, name_numeric: true },
        },
        section: {
          select: { section_id: true, name: true },
        },
      },
      orderBy: [{ exam: { date: 'desc' } }],
    });

    // Group marks by exam_id
    const examGroups = new Map<number, {
      exam_id: number;
      exam_name: string;
      year: string;
      term: string;
      date: Date | null;
      class_id: number;
      class_name: string;
      class_numeric: number;
      section_name: string;
      subjects: {
        subject_id: number;
        subject_name: string;
        mark_obtained: number;
        comment: string;
      }[];
    }>();

    for (const m of studentMarks) {
      if (!m.exam) continue;
      const eid = m.exam.exam_id;
      if (!examGroups.has(eid)) {
        examGroups.set(eid, {
          exam_id: eid,
          exam_name: m.exam.name,
          year: m.exam.year,
          term: m.exam.type || '',
          date: m.exam.date,
          class_id: m.exam.class?.class_id || m.class_id || 0,
          class_name: m.exam.class?.name || m.class?.name || '',
          class_numeric: m.exam.class?.name_numeric || m.class?.name_numeric || 0,
          section_name: m.section?.name || '',
          subjects: [],
        });
      }
      const group = examGroups.get(eid)!;
      group.subjects.push({
        subject_id: m.subject.subject_id,
        subject_name: m.subject.name,
        mark_obtained: m.mark_obtained,
        comment: m.comment,
      });
    }

    // Fetch grades for grading reference
    const grades = await db.grade.findMany({
      orderBy: { grade_from: 'desc' },
    });

    // Fetch invoices (receivables & payables)
    const invoices = await db.invoice.findMany({
      where: {
        student_id: studentId,
        can_delete: { not: 'trash' },
      },
      orderBy: { creation_timestamp: 'desc' },
      select: {
        invoice_id: true,
        invoice_code: true,
        title: true,
        amount: true,
        amount_paid: true,
        due: true,
        discount: true,
        creation_timestamp: true,
        payment_timestamp: true,
        status: true,
        year: true,
        term: true,
        can_delete: true,
      },
    });

    const receivables = invoices.filter(inv => inv.due > 0);
    const payables = invoices.filter(inv => inv.due < 0);

    // Fetch payments (receipt history)
    const payments = await db.payment.findMany({
      where: {
        student_id: studentId,
        can_delete: { not: 'trash' },
        invoice_code: { not: '' },
      },
      orderBy: { timestamp: 'desc' },
      select: {
        payment_id: true,
        invoice_code: true,
        receipt_code: true,
        amount: true,
        payment_method: true,
        timestamp: true,
        year: true,
        term: true,
      },
    });

    // Group payments by receipt_code for summary
    const receiptGroups = new Map<string, {
      receipt_code: string;
      timestamp: Date | null;
      payment_method: string;
      total_amount: number;
      year: string;
      term: string;
    }>();

    for (const p of payments) {
      const rc = p.receipt_code;
      if (!rc) continue;
      if (!receiptGroups.has(rc)) {
        receiptGroups.set(rc, {
          receipt_code: rc,
          timestamp: p.timestamp,
          payment_method: p.payment_method,
          total_amount: 0,
          year: p.year,
          term: p.term,
        });
      }
      const group = receiptGroups.get(rc)!;
      group.total_amount += p.amount;
    }

    // Fetch terminal reports
    const terminalReports = await db.terminal_reports.findMany({
      where: { student_id: studentId },
      include: {
        class: { select: { name: true, name_numeric: true } },
      },
      orderBy: [{ year: 'desc' }, { term: 'desc' }],
    });

    return NextResponse.json({
      student: {
        student_id: student.student_id,
        student_code: student.student_code,
        name: student.name,
        first_name: student.first_name,
        middle_name: student.middle_name,
        last_name: student.last_name,
        sex: student.sex,
        birthday: student.birthday,
        blood_group: student.blood_group,
        nationality: student.nationality,
        religion: student.religion,
        address: student.address,
        email: student.email,
        phone: student.phone,
        student_phone: student.student_phone,
        emergency_contact: student.emergency_contact,
        ghana_card_id: student.ghana_card_id,
        place_of_birth: student.place_of_birth,
        hometown: student.hometown,
        tribe: student.tribe,
        admission_date: student.admission_date,
        username: student.username,
        authentication_key: student.authentication_key,
        active_status: student.active_status,
        special_needs: student.special_needs,
        class_reached: student.class_reached,
        allergies: student.allergies,
        medical_conditions: student.medical_conditions,
        nhis_number: student.nhis_number,
        nhis_status: student.nhis_status,
        disability_status: student.disability_status,
        special_diet: student.special_diet,
        student_special_diet_details: student.student_special_diet_details,
        former_school: student.former_school,
        parent_id: student.parent_id,
      },
      parent: student.parent || null,
      enrolls: student.enrolls.map(e => ({
        enroll_id: e.enroll_id,
        class_id: e.class_id,
        section_id: e.section_id,
        year: e.year,
        term: e.term,
        roll: e.roll,
        mute: e.mute,
        residence_type: e.residence_type,
        class_name: e.class.name,
        class_numeric: e.class.name_numeric,
        class_category: e.class.category,
        section_name: e.section.name,
      })),
      currentEnroll: latestEnroll ? {
        enroll_id: latestEnroll.enroll_id,
        class_id: latestEnroll.class_id,
        section_id: latestEnroll.section_id,
        year: latestEnroll.year,
        term: latestEnroll.term,
        roll: latestEnroll.roll,
        mute: latestEnroll.mute,
        residence_type: latestEnroll.residence_type,
        class_name: latestEnroll.class.name,
        class_numeric: latestEnroll.class.name_numeric,
        class_category: latestEnroll.class.category,
        section_name: latestEnroll.section.name,
      } : null,
      status,
      statusColor,
      otherStudents,
      exams: Array.from(examGroups.values()),
      grades,
      invoices: {
        receivables: receivables.map(i => ({
          ...i,
          creation_timestamp: i.creation_timestamp,
        })),
        payables: payables.map(i => ({
          ...i,
          creation_timestamp: i.creation_timestamp,
        })),
      },
      payments: Array.from(receiptGroups.values()).sort(
        (a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)
      ),
      terminalReports,
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student profile' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/students/[id]
 * 
 * Update student profile. Matches CI3 Admin::student('update')
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const studentId = parseInt(id);

    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
    }

    const body = await request.json();

    // Check student exists
    const existing = await db.student.findUnique({
      where: { student_id: studentId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Build update data from allowed fields
    const allowedFields = [
      'first_name', 'middle_name', 'last_name', 'name',
      'sex', 'birthday', 'blood_group', 'nationality', 'religion',
      'address', 'email', 'phone', 'student_phone', 'emergency_contact',
      'ghana_card_id', 'place_of_birth', 'hometown', 'tribe',
      'admission_date', 'special_needs', 'class_reached',
      'allergies', 'medical_conditions', 'nhis_number', 'nhis_status',
      'disability_status', 'special_diet', 'student_special_diet_details',
      'former_school', 'active_status',
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Auto-generate full name from parts
    if (body.first_name || body.middle_name || body.last_name) {
      const fn = body.first_name || existing.first_name;
      const mn = body.middle_name || existing.middle_name;
      const ln = body.last_name || existing.last_name;
      updateData.name = [fn, mn, ln].filter(Boolean).join(' ');
    }

    // Convert date fields
    if (updateData.birthday && typeof updateData.birthday === 'string') {
      updateData.birthday = new Date(updateData.birthday);
    }
    if (updateData.admission_date && typeof updateData.admission_date === 'string') {
      updateData.admission_date = new Date(updateData.admission_date);
    }

    // Check email uniqueness (excluding self)
    if (updateData.email && updateData.email !== existing.email) {
      const emailExists = await db.student.findFirst({
        where: { email: updateData.email as string, student_id: { not: studentId } },
      });
      if (emailExists) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
      }
    }

    // Check username uniqueness (excluding self)
    if (body.username && body.username !== existing.username) {
      const usernameExists = await db.student.findFirst({
        where: { username: body.username, student_id: { not: studentId } },
      });
      if (usernameExists) {
        return NextResponse.json({ error: 'Username already in use' }, { status: 409 });
      }
      updateData.username = body.username;
    }

    const updatedStudent = await db.student.update({
      where: { student_id: studentId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Student profile updated successfully',
      student_id: updatedStudent.student_id,
    });
  } catch (error) {
    console.error('Error updating student profile:', error);
    return NextResponse.json(
      { error: 'Failed to update student profile' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/students/[id]
 * 
 * Delete a student. Matches CI3 Admin::delete_student
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const studentId = parseInt(id);

    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
    }

    // Delete student (cascading will handle related records)
    await db.student.delete({
      where: { student_id: studentId },
    });

    return NextResponse.json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { error: 'Failed to delete student. They may have related records that prevent deletion.' },
      { status: 500 }
    );
  }
}
