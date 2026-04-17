import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/reports/advanced?report_type=...&from=...&to=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('report_type') || 'students';
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';

    const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
    const toDate = to ? new Date(to) : new Date();

    switch (reportType) {
      case 'students':
        return await getStudentReport(fromDate, toDate);
      case 'teachers':
        return await getTeacherReport(fromDate, toDate);
      case 'finance':
        return await getFinanceReport(fromDate, toDate);
      case 'attendance':
        return await getAttendanceReport(fromDate, toDate);
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/* ---------- STUDENTS REPORT ---------- */
async function getStudentReport(from: Date, to: Date) {
  // Gender distribution
  const genderData = await db.student.groupBy({
    by: ['sex'],
    where: { active_status: 1 },
    _count: { student_id: true },
  });

  const genderDistribution = genderData.map(g => ({
    name: g.sex === 'male' ? 'Male' : g.sex === 'female' ? 'Female' : 'Other',
    value: g._count.student_id,
  }));

  // Enrollment by class
  const settings = await db.settings.findMany({
    where: { type: { in: ['running_year', 'running_term'] } },
  });
  let year = '', term = '';
  settings.forEach((s: any) => {
    if (s.type === 'running_year') year = s.description;
    if (s.type === 'running_term') term = s.description;
  });

  const enrollments = await db.enroll.groupBy({
    by: ['class_id'],
    where: { year: year || undefined, term: term || undefined, mute: 0 },
    _count: { enroll_id: true },
  });

  const classIds = enrollments.map(e => e.class_id);
  const classes = await db.school_class.findMany({
    where: { class_id: { in: classIds } },
    select: { class_id: true, name: true, name_numeric: true },
  });

  const enrollmentByClass = enrollments.map(e => {
    const cls = classes.find(c => c.class_id === e.class_id);
    return {
      name: cls?.name || `Class ${e.class_id}`,
      value: e._count.enroll_id,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  // Age analysis
  const studentsWithAge = await db.student.findMany({
    where: { active_status: 1, birthday: { not: null } },
    select: { birthday: true, sex: true },
  });

  const ageGroups: Record<string, number> = {
    '0-5': 0, '6-8': 0, '9-11': 0, '12-14': 0, '15-17': 0, '18+': 0,
  };
  studentsWithAge.forEach(s => {
    if (!s.birthday) return;
    const age = Math.floor((Date.now() - s.birthday.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age <= 5) ageGroups['0-5']++;
    else if (age <= 8) ageGroups['6-8']++;
    else if (age <= 11) ageGroups['9-11']++;
    else if (age <= 14) ageGroups['12-14']++;
    else if (age <= 17) ageGroups['15-17']++;
    else ageGroups['18+']++;
  });

  const ageDistribution = Object.entries(ageGroups).map(([name, value]) => ({ name, value }));

  // Admission trends
  const admissionTrends = await db.student.groupBy({
    by: ['admission_date'],
    where: {
      active_status: 1,
      admission_date: { not: null },
    },
    _count: { student_id: true },
  });

  const monthlyAdmissions: Record<string, number> = {};
  admissionTrends.forEach(t => {
    if (!t.admission_date) return;
    const key = `${t.admission_date.getFullYear()}-${String(t.admission_date.getMonth() + 1).padStart(2, '0')}`;
    monthlyAdmissions[key] = (monthlyAdmissions[key] || 0) + t._count.student_id;
  });

  const admissionTrendData = Object.entries(monthlyAdmissions)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([name, value]) => ({ name, value }));

  return NextResponse.json({
    report_type: 'students',
    data: {
      genderDistribution,
      enrollmentByClass,
      ageDistribution,
      admissionTrendData,
    },
  });
}

/* ---------- TEACHERS REPORT ---------- */
async function getTeacherReport(from: Date, to: Date) {
  // Qualification/designation distribution
  const designationData = await db.designation.findMany({
    include: {
      teachers: {
        where: { active_status: 1 },
        select: { teacher_id: true },
      },
    },
  });

  const qualificationDistribution = designationData
    .filter(d => d.teachers.length > 0)
    .map(d => ({
      name: d.des_name || 'Unspecified',
      value: d.teachers.length,
    }));

  // Department distribution
  const departmentData = await db.department.findMany({
    include: {
      teachers: {
        where: { active_status: 1 },
        select: { teacher_id: true },
      },
    },
  });

  const departmentDistribution = departmentData
    .filter(d => d.teachers.length > 0)
    .map(d => ({
      name: d.dep_name || 'Unspecified',
      value: d.teachers.length,
    }));

  // Subjects taught per teacher
  const teachers = await db.teacher.findMany({
    where: { active_status: 1 },
    select: {
      teacher_id: true,
      name: true,
      teacher_code: true,
      subjects: { select: { name: true } },
    },
  });

  const subjectsPerTeacher = teachers
    .map(t => ({
      name: t.name,
      code: t.teacher_code,
      subjects: t.subjects.length,
    }))
    .sort((a, b) => b.subjects - a.subjects)
    .slice(0, 15);

  // Gender distribution
  const teacherGender = await db.teacher.groupBy({
    by: ['gender'],
    where: { active_status: 1 },
    _count: { teacher_id: true },
  });

  const genderDistribution = teacherGender.map(g => ({
    name: g.gender === 'male' ? 'Male' : g.gender === 'female' ? 'Female' : 'Other',
    value: g._count.teacher_id,
  }));

  return NextResponse.json({
    report_type: 'teachers',
    data: {
      qualificationDistribution,
      departmentDistribution,
      subjectsPerTeacher,
      genderDistribution,
    },
  });
}

/* ---------- FINANCE REPORT ---------- */
async function getFinanceReport(from: Date, to: Date) {
  // Revenue trends (payments)
  const payments = await db.payment.findMany({
    where: {
      timestamp: { gte: from, lte: to },
      approval_status: 'approved',
    },
    select: {
      amount: true,
      timestamp: true,
      payment_method: true,
    },
  });

  const monthlyRevenue: Record<string, number> = {};
  payments.forEach(p => {
    if (!p.timestamp) return;
    const key = `${p.timestamp.getFullYear()}-${String(p.timestamp.getMonth() + 1).padStart(2, '0')}`;
    monthlyRevenue[key] = (monthlyRevenue[key] || 0) + p.amount;
  });

  const revenueTrend = Object.entries(monthlyRevenue)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));

  // Expense breakdown
  const expenses = await db.expense.findMany({
    where: {
      expense_date: { gte: from, lte: to },
    },
    select: {
      amount: true,
      category_id: true,
    },
  });

  const categories = await db.expense_category.findMany();
  const expenseByCategory: Record<string, number> = {};
  expenses.forEach(e => {
    const cat = categories.find(c => c.expense_category_id === e.category_id);
    const name = cat?.expense_category_name || 'Uncategorized';
    expenseByCategory[name] = (expenseByCategory[name] || 0) + e.amount;
  });

  const expenseBreakdown = Object.entries(expenseByCategory).map(([name, value]) => ({
    name,
    value: Math.round(value * 100) / 100,
  }));

  // Collection efficiency by class
  const settings = await db.settings.findMany({
    where: { type: { in: ['running_year', 'running_term'] } },
  });
  let year = '', term = '';
  settings.forEach((s: any) => {
    if (s.type === 'running_year') year = s.description;
    if (s.type === 'running_term') term = s.description;
  });

  const invoices = await db.invoice.findMany({
    where: { year: year || undefined, term: term || undefined, mute: 0 },
    select: { class_id: true, amount: true, amount_paid: true, class_name: true },
  });

  const classEfficiency: Record<string, { total: number; paid: number; name: string }> = {};
  invoices.forEach(inv => {
    const key = inv.class_name || `Class ${inv.class_id}`;
    if (!classEfficiency[key]) classEfficiency[key] = { total: 0, paid: 0, name: key };
    classEfficiency[key].total += inv.amount;
    classEfficiency[key].paid += inv.amount_paid;
  });

  const collectionEfficiency = Object.values(classEfficiency)
    .map(c => ({
      name: c.name,
      total: Math.round(c.total * 100) / 100,
      paid: Math.round(c.paid * 100) / 100,
      percentage: c.total > 0 ? Math.round((c.paid / c.total) * 100) : 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Payment method breakdown
  const cashTotal = payments.filter(p => p.payment_method === 'cash').reduce((s, p) => s + p.amount, 0);
  const momoTotal = payments.filter(p => p.payment_method === 'mobile_money' || p.payment_method === 'momo').reduce((s, p) => s + p.amount, 0);
  const otherTotal = payments.reduce((s, p) => s + p.amount, 0) - cashTotal - momoTotal;

  const paymentMethods = [
    { name: 'Cash', value: Math.round(cashTotal * 100) / 100 },
    { name: 'Mobile Money', value: Math.round(momoTotal * 100) / 100 },
    { name: 'Other', value: Math.round(otherTotal * 100) / 100 },
  ].filter(m => m.value > 0);

  return NextResponse.json({
    report_type: 'finance',
    data: {
      revenueTrend,
      expenseBreakdown,
      collectionEfficiency,
      paymentMethods,
    },
  });
}

/* ---------- ATTENDANCE REPORT ---------- */
async function getAttendanceReport(from: Date, to: Date) {
  // Daily attendance trends
  const attendanceRecords = await db.attendance.findMany({
    where: {
      date: { gte: from.toISOString().split('T')[0], lte: to.toISOString().split('T')[0] },
    },
    select: { date: true, status: true, student_id: true, class_id: true, sex: true },
  });

  // Get student gender info for gender comparison
  const studentIds = [...new Set(attendanceRecords.map(a => a.student_id))];
  const studentInfo = await db.student.findMany({
    where: { student_id: { in: studentIds } },
    select: { student_id: true, sex: true },
  });
  const studentMap = new Map(studentInfo.map(s => [s.student_id, s.sex]));

  // Daily trend
  const dailyStats: Record<string, { present: number; absent: number; late: number }> = {};
  attendanceRecords.forEach(a => {
    if (!dailyStats[a.date]) dailyStats[a.date] = { present: 0, absent: 0, late: 0 };
    const status = a.status?.toLowerCase() || '';
    if (status === 'present' || status === '1') dailyStats[a.date].present++;
    else if (status === 'absent' || status === '0') dailyStats[a.date].absent++;
    else if (status === 'late') dailyStats[a.date].late++;
  });

  const dailyTrend = Object.entries(dailyStats)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, counts]) => ({
      name: date,
      present: counts.present,
      absent: counts.absent,
      late: counts.late,
    }));

  // Class comparison
  const classStats: Record<string, { present: number; absent: number; total: number }> = {};
  attendanceRecords.forEach(a => {
    const key = `Class ${a.class_id}`;
    if (!classStats[key]) classStats[key] = { present: 0, absent: 0, total: 0 };
    classStats[key].total++;
    const status = a.status?.toLowerCase() || '';
    if (status === 'present' || status === '1') classStats[key].present++;
    else if (status === 'absent' || status === '0') classStats[key].absent++;
  });

  // Get class names
  const classIdsInAttendance = [...new Set(attendanceRecords.map(a => a.class_id).filter(Boolean))];
  const classNames = await db.school_class.findMany({
    where: { class_id: { in: classIdsInAttendance } },
    select: { class_id: true, name: true },
  });
  const classMap = new Map(classNames.map(c => [c.class_id, c.name]));

  const classComparison = Object.entries(classStats)
    .map(([key, counts]) => ({
      name: classMap.get(parseInt(key.replace('Class ', ''))) || key,
      present: counts.present,
      absent: counts.absent,
      total: counts.total,
      rate: counts.total > 0 ? Math.round((counts.present / counts.total) * 100) : 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Gender comparison
  const genderStats: Record<string, { present: number; absent: number }> = { male: { present: 0, absent: 0 }, female: { present: 0, absent: 0 } };
  attendanceRecords.forEach(a => {
    const sex = studentMap.get(a.student_id) || '';
    if (sex !== 'male' && sex !== 'female') return;
    const status = a.status?.toLowerCase() || '';
    if (status === 'present' || status === '1') genderStats[sex].present++;
    else if (status === 'absent' || status === '0') genderStats[sex].absent++;
  });

  const genderComparison = Object.entries(genderStats).map(([name, counts]) => ({
    name: name === 'male' ? 'Male' : 'Female',
    present: counts.present,
    absent: counts.absent,
    total: counts.present + counts.absent,
    rate: counts.present + counts.absent > 0 ? Math.round((counts.present / (counts.present + counts.absent)) * 100) : 0,
  }));

  // Monthly trend
  const monthlyStats: Record<string, { present: number; absent: number }> = {};
  attendanceRecords.forEach(a => {
    const monthKey = a.date?.substring(0, 7) || '';
    if (!monthKey) return;
    if (!monthlyStats[monthKey]) monthlyStats[monthKey] = { present: 0, absent: 0 };
    const status = a.status?.toLowerCase() || '';
    if (status === 'present' || status === '1') monthlyStats[monthKey].present++;
    else if (status === 'absent' || status === '0') monthlyStats[monthKey].absent++;
  });

  const monthlyTrend = Object.entries(monthlyStats)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([name, counts]) => ({
      name,
      present: counts.present,
      absent: counts.absent,
    }));

  return NextResponse.json({
    report_type: 'attendance',
    data: {
      dailyTrend,
      classComparison,
      genderComparison,
      monthlyTrend,
    },
  });
}
