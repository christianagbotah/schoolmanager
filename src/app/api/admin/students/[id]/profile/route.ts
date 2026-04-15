import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/students/[id]/profile
 *
 * Comprehensive student profile data for the enhanced profile view.
 * Includes: student info, enrollment, subjects, marks, attendance, invoices, payments, parent info.
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

    // ── Student with parent and enrollments ──
    const student = await db.student.findUnique({
      where: { student_id: studentId },
      include: {
        parent: {
          select: {
            parent_id: true, name: true, guardian_gender: true, guardian_is_the: true,
            email: true, phone: true, address: true, profession: true, designation: true,
            father_name: true, father_phone: true, mother_name: true, mother_phone: true,
            active_status: true,
          },
        },
        enrolls: {
          include: {
            class: { select: { class_id: true, name: true, name_numeric: true, category: true } },
            section: { select: { section_id: true, name: true } },
          },
          orderBy: { enroll_id: 'desc' },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Current / latest enrollment
    const currentEnroll = student.enrolls.find(e => e.mute === 0) || student.enrolls[0];
    const latestEnroll = student.enrolls[0];

    // Status determination
    let status = 'INACTIVE';
    let statusColor = 'bg-gray-400';
    if (currentEnroll) {
      status = 'ACTIVE';
      statusColor = 'bg-green-500';
    } else if (latestEnroll) {
      const cn = latestEnroll.class?.name;
      const nn = latestEnroll.class?.name_numeric;
      const lt = latestEnroll.term;
      if (cn === 'JHS' && nn === 3 && lt === '3') {
        status = 'COMPLETED';
        statusColor = 'bg-blue-500';
      }
    }

    // ── Subjects for current enrollment ──
    let subjects: { subject_id: number; name: string; teacher_name: string }[] = [];
    if (currentEnroll) {
      const subjectRows = await db.subject.findMany({
        where: {
          class_id: currentEnroll.class_id,
          status: 1,
        },
        include: {
          teacher: { select: { name: true } },
        },
        orderBy: { name: 'asc' },
      });
      subjects = subjectRows.map(s => ({
        subject_id: s.subject_id,
        name: s.name,
        teacher_name: s.teacher?.name || 'N/A',
      }));
    }

    // ── Exam marks grouped by exam ──
    const studentMarks = await db.mark.findMany({
      where: { student_id: studentId },
      include: {
        subject: { select: { subject_id: true, name: true } },
        exam: {
          select: {
            exam_id: true, name: true, year: true, date: true, type: true,
            class: { select: { class_id: true, name: true, name_numeric: true } },
          },
        },
        class: { select: { class_id: true, name: true, name_numeric: true } },
        section: { select: { section_id: true, name: true } },
      },
      orderBy: [{ exam: { date: 'desc' } }],
    });

    const examGroups = new Map<number, {
      exam_id: number; exam_name: string; year: string; term: string;
      date: Date | null; class_name: string; class_numeric: number; section_name: string;
      subjects: { subject_id: number; subject_name: string; mark_obtained: number; comment: string }[];
    }>();

    for (const m of studentMarks) {
      if (!m.exam) continue;
      const eid = m.exam.exam_id;
      if (!examGroups.has(eid)) {
        examGroups.set(eid, {
          exam_id: eid, exam_name: m.exam.name, year: m.exam.year,
          term: m.exam.type || '', date: m.exam.date,
          class_name: m.exam.class?.name || m.class?.name || '',
          class_numeric: m.exam.class?.name_numeric || m.class?.name_numeric || 0,
          section_name: m.section?.name || '', subjects: [],
        });
      }
      examGroups.get(eid)!.subjects.push({
        subject_id: m.subject.subject_id, subject_name: m.subject.name,
        mark_obtained: m.mark_obtained, comment: m.comment,
      });
    }

    // ── Grades for grading reference ──
    const grades = await db.grade.findMany({ orderBy: { grade_from: 'desc' } });

    // ── Terminal reports ──
    const terminalReports = await db.terminal_reports.findMany({
      where: { student_id: studentId },
      include: { class: { select: { name: true, name_numeric: true } } },
      orderBy: [{ year: 'desc' }, { term: 'desc' }],
    });

    // ── Attendance summary ──
    const attendanceRecords = await db.attendance.findMany({
      where: { student_id: studentId },
      select: {
        attendance_id: true, date: true, status: true, year: true, term: true,
        class_id: true, section_id: true, timestamp: true, checked_in: true, checked_out: true,
      },
      orderBy: { date: 'desc' },
    });

    const totalAttendance = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(a => a.status === 'present' || a.status === '1').length;
    const absentCount = attendanceRecords.filter(a => a.status === 'absent' || a.status === '0').length;
    const lateCount = attendanceRecords.filter(a => a.status === 'late').length;
    const attendanceRate = totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(1) : '0.0';

    // Monthly attendance breakdown (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    const recentAttendance = attendanceRecords.filter(a => {
      if (!a.date) return false;
      const d = new Date(a.date);
      return d >= sixMonthsAgo;
    });

    // Group by month
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyAttendance: { month: string; monthLabel: string; present: number; absent: number; total: number }[] = [];
    const grouped = new Map<string, { present: number; absent: number; total: number }>();
    for (const a of recentAttendance) {
      if (!a.date) continue;
      const d = new Date(a.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped.has(key)) {
        grouped.set(key, { present: 0, absent: 0, total: 0 });
      }
      const g = grouped.get(key)!;
      g.total++;
      if (a.status === 'present' || a.status === '1') g.present++;
      if (a.status === 'absent' || a.status === '0') g.absent++;
    }
    for (const [key, val] of grouped) {
      const [y, m] = key.split('-');
      monthlyAttendance.push({
        month: key, monthLabel: `${monthLabels[parseInt(m) - 1]} ${y.slice(2)}`,
        present: val.present, absent: val.absent, total: val.total,
      });
    }
    monthlyAttendance.sort((a, b) => a.month.localeCompare(b.month));

    // ── Invoices ──
    const invoices = await db.invoice.findMany({
      where: { student_id: studentId, can_delete: { not: 'trash' } },
      orderBy: { creation_timestamp: 'desc' },
      select: {
        invoice_id: true, invoice_code: true, title: true, description: true,
        amount: true, amount_paid: true, due: true, discount: true,
        creation_timestamp: true, payment_timestamp: true, status: true,
        year: true, term: true, class_name: true, can_delete: true,
      },
    });

    const totalFees = invoices.reduce((s, i) => s + i.amount, 0);
    const totalPaid = invoices.reduce((s, i) => s + i.amount_paid, 0);
    const totalOutstanding = invoices.reduce((s, i) => s + (i.due > 0 ? i.due : 0), 0);

    // ── Payments (receipt history) ──
    const payments = await db.payment.findMany({
      where: { student_id: studentId, can_delete: { not: 'trash' }, invoice_code: { not: '' } },
      orderBy: { timestamp: 'desc' },
      select: {
        payment_id: true, invoice_code: true, receipt_code: true, title: true,
        amount: true, payment_method: true, timestamp: true, year: true, term: true,
      },
    });

    // Group by receipt_code
    const receiptGroups = new Map<string, {
      receipt_code: string; timestamp: Date | null; payment_method: string;
      total_amount: number; year: string; term: string;
    }>();
    for (const p of payments) {
      const rc = p.receipt_code;
      if (!rc) continue;
      if (!receiptGroups.has(rc)) {
        receiptGroups.set(rc, {
          receipt_code: rc, timestamp: p.timestamp, payment_method: p.payment_method,
          total_amount: 0, year: p.year, term: p.term,
        });
      }
      receiptGroups.get(rc)!.total_amount += p.amount;
    }

    // ── Classmates for student switcher ──
    let otherStudents: { student_id: number; name: string; student_code: string }[] = [];
    if (latestEnroll) {
      const classMates = await db.enroll.findMany({
        where: { class_id: latestEnroll.class_id, mute: 0, student_id: { not: studentId } },
        include: { student: { select: { student_id: true, name: true, student_code: true } } },
        take: 200,
      });
      otherStudents = classMates
        .filter(c => c.student)
        .map(c => ({ student_id: c.student.student_id, name: c.student.name, student_code: c.student.student_code }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    return NextResponse.json({
      student: {
        student_id: student.student_id, student_code: student.student_code,
        name: student.name, first_name: student.first_name, middle_name: student.middle_name,
        last_name: student.last_name, sex: student.sex, birthday: student.birthday,
        blood_group: student.blood_group, nationality: student.nationality, religion: student.religion,
        address: student.address, email: student.email, phone: student.phone,
        student_phone: student.student_phone, emergency_contact: student.emergency_contact,
        ghana_card_id: student.ghana_card_id, place_of_birth: student.place_of_birth,
        hometown: student.hometown, tribe: student.tribe, admission_date: student.admission_date,
        username: student.username, active_status: student.active_status,
        special_needs: student.special_needs, class_reached: student.class_reached,
        allergies: student.allergies, medical_conditions: student.medical_conditions,
        nhis_number: student.nhis_number, nhis_status: student.nhis_status,
        disability_status: student.disability_status, special_diet: student.special_diet,
        student_special_diet_details: student.student_special_diet_details,
        former_school: student.former_school, parent_id: student.parent_id,
      },
      parent: student.parent || null,
      enrolls: student.enrolls.map(e => ({
        enroll_id: e.enroll_id, class_id: e.class_id, section_id: e.section_id,
        year: e.year, term: e.term, roll: e.roll, mute: e.mute, residence_type: e.residence_type,
        class_name: e.class.name, class_numeric: e.class.name_numeric,
        class_category: e.class.category, section_name: e.section.name,
      })),
      currentEnroll: latestEnroll ? {
        enroll_id: latestEnroll.enroll_id, class_id: latestEnroll.class_id,
        section_id: latestEnroll.section_id, year: latestEnroll.year, term: latestEnroll.term,
        roll: latestEnroll.roll, mute: latestEnroll.mute, residence_type: latestEnroll.residence_type,
        class_name: latestEnroll.class.name, class_numeric: latestEnroll.class.name_numeric,
        class_category: latestEnroll.class.category, section_name: latestEnroll.section.name,
      } : null,
      status, statusColor, otherStudents, subjects,
      exams: Array.from(examGroups.values()),
      grades, terminalReports,
      attendance: {
        total: totalAttendance, present: presentCount, absent: absentCount,
        late: lateCount, rate: parseFloat(attendanceRate),
        records: attendanceRecords.slice(0, 200),
        monthly: monthlyAttendance,
      },
      invoices: {
        all: invoices,
        receivables: invoices.filter(i => i.due > 0),
        payables: invoices.filter(i => i.due < 0),
        summary: { totalFees, totalPaid, totalOutstanding },
      },
      payments: Array.from(receiptGroups.values()).sort(
        (a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)
      ),
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return NextResponse.json({ error: 'Failed to fetch student profile' }, { status: 500 });
  }
}
