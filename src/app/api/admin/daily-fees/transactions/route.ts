import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/daily-fees/transactions - List transactions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const studentId = searchParams.get('student_id') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const feeType = searchParams.get('fee_type') || '';

    const where: any = {};
    if (studentId) where.student_id = parseInt(studentId);
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.payment_date = { gte: start, lte: end };
    }

    const [transactions, total] = await Promise.all([
      db.daily_fee_transactions.findMany({
        where,
        include: {
          student: { select: { student_id: true, name: true, student_code: true } },
        },
        orderBy: { id: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.daily_fee_transactions.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/daily-fees/transactions - Collect daily fees
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

    return NextResponse.json({
      status: 'success',
      message: `GH₵ ${total.toFixed(2)} collected successfully`,
      transaction,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
