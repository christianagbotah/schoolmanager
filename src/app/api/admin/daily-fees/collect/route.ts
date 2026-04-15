import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/daily-fees/collect - Get enrolled students and class rates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('class_id') || '';
    const search = searchParams.get('search') || '';

    const settings = await db.settings.findMany({
      where: { type: { in: ['running_year', 'running_term'] } },
    });
    let year = '', term = '';
    settings.forEach((s: any) => {
      if (s.type === 'running_year') year = s.description;
      if (s.type === 'running_term') term = s.description;
    });

    if (classId) {
      // Get enrolled students for a specific class
      const enrollments = await db.enroll.findMany({
        where: { class_id: parseInt(classId), year, term, mute: 0 },
        include: {
          student: {
            select: { student_id: true, name: true, student_code: true, sex: true },
          },
          class: { select: { class_id: true, name: true, name_numeric: true, category: true } },
          section: { select: { section_id: true, name: true } },
        },
        orderBy: { student: { name: 'asc' } },
      });

      // Get rates for this class
      const rates = await db.daily_fee_rates.findFirst({
        where: { class_id: parseInt(classId), year, term },
      });

      // Check if any transactions exist today for these students
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const todayTx = await db.daily_fee_transactions.findMany({
        where: { payment_date: { gte: todayStart, lte: todayEnd } },
        select: { student_id: true, transaction_code: true, total_amount: true },
      });
      const todayTxMap = new Map(todayTx.map((t: any) => [t.student_id, t]));

      const students = enrollments.map((e: any) => ({
        student_id: e.student.student_id,
        name: e.student.name,
        student_code: e.student.student_code,
        sex: e.student.sex,
        class_id: e.class_id,
        class_name: e.class?.name || '',
        name_numeric: e.class?.name_numeric || 0,
        section_name: e.section?.name || '',
        todayTransaction: todayTxMap.get(e.student.student_id) || null,
      }));

      return NextResponse.json({ students, rates, classId: parseInt(classId), year, term });
    }

    // All enrolled students (for search)
    const where: any = { year, term, mute: 0 };
    const enrollments = await db.enroll.findMany({
      where,
      include: {
        student: {
          select: { student_id: true, name: true, student_code: true, sex: true },
          where: search ? {
            OR: [
              { name: { contains: search } },
              { student_code: { contains: search } },
            ],
          } : undefined,
        },
        class: {
          select: { class_id: true, name: true, name_numeric: true, category: true },
          include: { daily_fee_rates: { where: { year, term } } },
        },
        section: { select: { section_id: true, name: true } },
      },
      orderBy: { student: { name: 'asc' } },
    });

    const students = enrollments
      .filter((e: any) => e.student !== null)
      .map((e: any) => ({
        student_id: e.student.student_id,
        name: e.student.name,
        student_code: e.student.student_code,
        sex: e.student.sex,
        class_id: e.class_id,
        class_name: e.class?.name || '',
        name_numeric: e.class?.name_numeric || 0,
        category: e.class?.category || '',
        section_name: e.section?.name || '',
        rates: e.class?.daily_fee_rates?.[0] || null,
      }));

    return NextResponse.json({ students, year, term });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
