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

      // Get transport route for each student from bus_attendance (latest record)
      const studentIds = enrollments.map(e => e.student_id);
      const recentBusAttendance = studentIds.length > 0
        ? await db.bus_attendance.findMany({
            where: { student_id: { in: studentIds } },
            include: { transport: { select: { transport_id: true, route_name: true, fare: true } } },
            orderBy: { id: 'desc' },
          })
        : [];
      // Build map: first bus_attendance record per student (latest due to desc ordering)
      const transportMap = new Map<number, { route_id: number; route_name: string; fare: number }>();
      for (const ba of recentBusAttendance) {
        if (!transportMap.has(ba.student_id) && ba.route_id) {
          transportMap.set(ba.student_id, {
            route_id: ba.route_id,
            route_name: ba.transport?.route_name || '',
            fare: ba.transport?.fare || 0,
          });
        }
      }

      const students = enrollments.map((e: any) => ({
        student_id: e.student.student_id,
        name: e.student.name,
        student_code: e.student.student_code,
        sex: e.student.sex,
        class_id: e.class_id,
        class_name: e.class?.name || '',
        name_numeric: e.class?.name_numeric || 0,
        section_name: e.section?.name || '',
        transport: transportMap.get(e.student.student_id) || null,
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

    // Get transport info for all students
    const allStudentIds = enrollments.filter((e: any) => e.student !== null).map((e: any) => e.student.student_id);
    const allBusAttendance = allStudentIds.length > 0
      ? await db.bus_attendance.findMany({
          where: { student_id: { in: allStudentIds } },
          include: { transport: { select: { transport_id: true, route_name: true, fare: true } } },
          orderBy: { id: 'desc' },
        })
      : [];
    const allTransportMap = new Map<number, { route_id: number; route_name: string; fare: number }>();
    for (const ba of allBusAttendance) {
      if (!allTransportMap.has(ba.student_id) && ba.route_id) {
        allTransportMap.set(ba.student_id, {
          route_id: ba.route_id,
          route_name: ba.transport?.route_name || '',
          fare: ba.transport?.fare || 0,
        });
      }
    }

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
        transport: allTransportMap.get(e.student.student_id) || null,
      }));

    return NextResponse.json({ students, year, term });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/daily-fees/collect - Collect daily fees
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      student_id,
      feeding_amount = 0,
      breakfast_amount = 0,
      classes_amount = 0,
      water_amount = 0,
      transport_amount = 0,
      transport_direction = 'none',
      payment_method = 'cash',
      collected_by = 'Admin',
      payment_date,
    } = body;

    if (!student_id) {
      return NextResponse.json({ error: 'student_id required' }, { status: 400 });
    }

    const total = feeding_amount + breakfast_amount + classes_amount + water_amount + transport_amount;
    if (total <= 0) {
      return NextResponse.json({ error: 'At least one fee amount must be greater than 0' }, { status: 400 });
    }

    // Get running year/term
    const settings = await db.settings.findMany({
      where: { type: { in: ['running_year', 'running_term'] } },
    });
    let year = '', term = '';
    settings.forEach((s: any) => {
      if (s.type === 'running_year') year = s.description;
      if (s.type === 'running_term') term = s.description;
    });

    // Generate transaction code
    const txCount = await db.daily_fee_transactions.count();
    const txCode = `DFT-${String(txCount + 1).padStart(6, '0')}`;

    // Create transaction
    const transaction = await db.daily_fee_transactions.create({
      data: {
        transaction_code: txCode,
        student_id,
        payment_date: payment_date ? new Date(payment_date) : new Date(),
        feeding_amount,
        breakfast_amount,
        classes_amount,
        water_amount,
        transport_amount,
        total_amount: total,
        payment_method,
        collected_by,
        year,
        term,
      },
    });

    // Upsert wallet and update balances
    const existingWallet = await db.daily_fee_wallet.findUnique({
      where: { student_id },
    });

    if (existingWallet) {
      await db.daily_fee_wallet.update({
        where: { student_id },
        data: {
          feeding_balance: existingWallet.feeding_balance + feeding_amount,
          breakfast_balance: existingWallet.breakfast_balance + breakfast_amount,
          classes_balance: existingWallet.classes_balance + classes_amount,
          water_balance: existingWallet.water_balance + water_amount,
          transport_balance: existingWallet.transport_balance + transport_amount,
        },
      });
    } else {
      await db.daily_fee_wallet.create({
        data: {
          student_id,
          feeding_balance: feeding_amount,
          breakfast_balance: breakfast_amount,
          classes_balance: classes_amount,
          water_balance: water_amount,
          transport_balance: transport_amount,
        },
      });
    }

    // Generate receipt number
    const rcptCount = await db.receipts.count();
    const rcptNumber = `RCP-${String(rcptCount + 1).padStart(6, '0')}`;

    const student = await db.student.findUnique({
      where: { student_id },
      select: { name: true, student_code: true },
    });

    const receipt = await db.receipts.create({
      data: {
        receipt_number: rcptNumber,
        student_id,
        amount: total,
        payment_method,
        receipt_type: 'daily_fee',
        generated_at: new Date(),
        generated_by: collected_by,
      },
    });

    return NextResponse.json({
      status: 'success',
      message: `GH\u20B5 ${total.toFixed(2)} collected successfully`,
      transaction,
      receipt: {
        receipt_number: rcptNumber,
        student_name: student?.name,
        student_code: student?.student_code,
        amount: total,
        method: payment_method,
        items: {
          feeding: feeding_amount,
          breakfast: breakfast_amount,
          classes: classes_amount,
          water: water_amount,
          transport: transport_amount,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
