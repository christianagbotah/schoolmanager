import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET: Fetch student wallet info
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const studentIdNum = parseInt(studentId);
    const student = await db.student.findUnique({
      where: { student_id: studentIdNum },
      include: {
        daily_fee_wallet: true,
        enrolls: { where: { year: '2026', term: 'Term 1' }, take: 1, include: { class: true } },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const enroll = student.enrolls[0];
    let rates: { class_id: number; year: string; id: number; term: string; feeding_rate: number; breakfast_rate: number; classes_rate: number; water_rate: number } | null = null;
    if (enroll) {
      rates = await db.daily_fee_rates.findFirst({
        where: { class_id: enroll.class_id, year: '2026', term: 'Term 1' },
      });
    }

    return NextResponse.json({
      student: { student_id: student.student_id, name: student.name, student_code: student.student_code },
      class: enroll?.class || null,
      wallet: student.daily_fee_wallet || null,
      rates,
    });
  } catch (error) {
    console.error('Error fetching daily fee wallet:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet info' }, { status: 500 });
  }
}

// POST: Collect daily fees
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, feedingAmount, breakfastAmount, classesAmount, waterAmount, transportAmount, paymentMethod, collectedBy } = body;

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const totalAmount = (feedingAmount || 0) + (breakfastAmount || 0) + (classesAmount || 0) + (waterAmount || 0) + (transportAmount || 0);

    if (totalAmount <= 0) {
      return NextResponse.json({ error: 'At least one fee amount must be greater than zero' }, { status: 400 });
    }

    const transactionCode = `DFT-${String(Date.now()).slice(-6)}`;

    const student = await db.student.findUnique({ where: { student_id: studentId } });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Create or update wallet
    let wallet = await db.daily_fee_wallet.findUnique({ where: { student_id: studentId } });

    if (!wallet) {
      wallet = await db.daily_fee_wallet.create({
        data: {
          student_id: studentId,
          feeding_balance: -(feedingAmount || 0),
          breakfast_balance: -(breakfastAmount || 0),
          classes_balance: -(classesAmount || 0),
          water_balance: -(waterAmount || 0),
          transport_balance: -(transportAmount || 0),
        },
      });
    } else {
      wallet = await db.daily_fee_wallet.update({
        where: { student_id: studentId },
        data: {
          feeding_balance: wallet.feeding_balance - (feedingAmount || 0),
          breakfast_balance: wallet.breakfast_balance - (breakfastAmount || 0),
          classes_balance: wallet.classes_balance - (classesAmount || 0),
          water_balance: wallet.water_balance - (waterAmount || 0),
          transport_balance: wallet.transport_balance - (transportAmount || 0),
        },
      });
    }

    // Create transaction
    const transaction = await db.daily_fee_transactions.create({
      data: {
        transaction_code: transactionCode,
        student_id: studentId,
        payment_date: new Date(),
        feeding_amount: feedingAmount || 0,
        breakfast_amount: breakfastAmount || 0,
        classes_amount: classesAmount || 0,
        water_amount: waterAmount || 0,
        transport_amount: transportAmount || 0,
        total_amount: totalAmount,
        payment_type: 'daily',
        payment_method: paymentMethod || 'cash',
        collected_by: collectedBy || 'System',
        year: '2026',
        term: 'Term 1',
      },
    });

    // Create receipt
    await db.receipts.create({
      data: {
        receipt_number: `RCP-DFT-${String(Date.now()).slice(-6)}`,
        student_id: studentId,
        parent_id: student.parent_id,
        payment_id: null,
        amount: totalAmount,
        payment_method: paymentMethod || 'cash',
        receipt_type: 'daily_fee',
        generated_at: new Date(),
        generated_by: collectedBy || 'System',
      },
    });

    return NextResponse.json({ transaction, wallet, message: 'Daily fee collected successfully' });
  } catch (error) {
    console.error('Error collecting daily fee:', error);
    return NextResponse.json({ error: 'Failed to collect daily fee' }, { status: 500 });
  }
}
