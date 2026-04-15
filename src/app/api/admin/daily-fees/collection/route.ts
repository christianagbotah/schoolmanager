import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/daily-fees/collection - Search students and get fee balance
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const studentId = searchParams.get('student_id') || '';

    const settings = await db.settings.findMany({
      where: { type: { in: ['running_year', 'running_term'] } },
    });
    let year = '', term = '';
    settings.forEach((s: any) => {
      if (s.type === 'running_year') year = s.description;
      if (s.type === 'running_term') term = s.description;
    });

    // If searching for specific student balance
    if (studentId) {
      const sid = parseInt(studentId);
      const wallet = await db.daily_fee_wallet.findUnique({
        where: { student_id: sid },
      });

      const student = await db.student.findUnique({
        where: { student_id: sid },
        select: { student_id: true, name: true, student_code: true, sex: true },
      });

      // Get latest transactions
      const recentTx = await db.daily_fee_transactions.findMany({
        where: { student_id: sid },
        orderBy: { id: 'desc' },
        take: 10,
      });

      // Get enrollment for class/rate info
      const enrollment = await db.enroll.findFirst({
        where: { student_id: sid, year, term, mute: 0 },
        include: {
          class: {
            select: { class_id: true, name: true, name_numeric: true, category: true },
            include: { daily_fee_rates: { where: { year, term } } },
          },
        },
      });

      const rates = enrollment?.class?.daily_fee_rates?.[0] || null;
      const classInfo = enrollment?.class || null;

      return NextResponse.json({
        student,
        wallet,
        rates,
        classInfo,
        recentTransactions: recentTx,
      });
    }

    // Search students
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
      },
      orderBy: { student: { name: 'asc' } },
      take: 50,
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
        rates: e.class?.daily_fee_rates?.[0] || null,
      }));

    // Also get classes list for dropdown
    const classes = await db.school_class.findMany({
      select: { class_id: true, name: true, name_numeric: true, category: true },
      orderBy: [{ category: 'asc' }, { name_numeric: 'asc' }],
    });

    return NextResponse.json({ students, classes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/daily-fees/collection - Collect fee
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
      payment_method = 'cash',
      collected_by = 'Admin',
      payment_date,
    } = body;

    if (!student_id) {
      return NextResponse.json({ error: 'student_id required' }, { status: 400 });
    }

    const total = feeding_amount + breakfast_amount + classes_amount + water_amount + transport_amount;
    if (total <= 0) {
      return NextResponse.json({ error: 'At least one fee amount must be > 0' }, { status: 400 });
    }

    const settings = await db.settings.findMany({
      where: { type: { in: ['running_year', 'running_term'] } },
    });
    let year = '', term = '';
    settings.forEach((s: any) => {
      if (s.type === 'running_year') year = s.description;
      if (s.type === 'running_term') term = s.description;
    });

    const txCount = await db.daily_fee_transactions.count();
    const txCode = `DFT-${String(txCount + 1).padStart(6, '0')}`;

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

    // Upsert wallet
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
