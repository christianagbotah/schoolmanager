import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/accountant/credits - Student credit balances and transactions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const studentId = searchParams.get('studentId');

    // Fetch wallets
    const whereClause: Record<string, unknown> = {};
    if (studentId) whereClause.student_id = parseInt(studentId);

    if (search) {
      whereClause.student = {
        OR: [
          { name: { contains: search } },
          { student_code: { contains: search } },
        ],
      };
    }

    const [wallets, totalCount] = await Promise.all([
      db.daily_fee_wallet.findMany({
        where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
        include: {
          student: {
            select: { student_id: true, name: true, student_code: true, enrolls: { orderBy: { enroll_id: 'desc' }, take: 1, select: { class: { select: { name: true } }, section: { select: { name: true } } } } },
          },
        },
        orderBy: { id: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.daily_fee_wallet.count({ where: Object.keys(whereClause).length > 0 ? whereClause : undefined }),
    ]);

    const walletData = wallets.map(w => ({
      id: w.id,
      student_id: w.student_id,
      name: w.student?.name || 'Unknown',
      student_code: w.student?.student_code || '',
      class_name: w.student?.enrolls?.[0]?.class?.name || '',
      feeding_balance: w.feeding_balance,
      breakfast_balance: w.breakfast_balance,
      classes_balance: w.classes_balance,
      water_balance: w.water_balance,
      transport_balance: w.transport_balance,
      total: w.feeding_balance + w.breakfast_balance + w.classes_balance + w.water_balance + w.transport_balance,
    }));

    // Summary stats
    const aggregates = await db.daily_fee_wallet.aggregate({
      _sum: {
        feeding_balance: true,
        breakfast_balance: true,
        classes_balance: true,
        water_balance: true,
        transport_balance: true,
      },
      _count: true,
    });

    const totalBalance = (aggregates._sum.feeding_balance || 0) + (aggregates._sum.breakfast_balance || 0) +
      (aggregates._sum.classes_balance || 0) + (aggregates._sum.water_balance || 0) + (aggregates._sum.transport_balance || 0);

    const studentsWithCredit = wallets.filter(w =>
      w.feeding_balance + w.breakfast_balance + w.classes_balance + w.water_balance + w.transport_balance > 0
    ).length;

    // Recent transactions
    const recentTransactions = studentId ? await db.daily_fee_transactions.findMany({
      where: { student_id: parseInt(studentId) },
      include: { student: { select: { name: true, student_code: true } } },
      orderBy: { id: 'desc' },
      take: 50,
    }) : [];

    // Recent top-ups (last 30 days, payment_type 'topup')
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTopUps = await db.daily_fee_transactions.findMany({
      where: {
        payment_date: { gte: thirtyDaysAgo },
        total_amount: { gt: 0 },
        payment_type: 'topup',
      },
      include: { student: { select: { name: true, student_code: true } } },
      orderBy: { payment_date: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      wallets: walletData,
      pagination: { page, limit, total: totalCount, totalPages: Math.ceil(totalCount / limit) },
      summary: {
        totalBalance,
        studentsWithCredit,
        avgBalance: studentsWithCredit > 0 ? totalBalance / studentsWithCredit : 0,
        feeding: aggregates._sum.feeding_balance || 0,
        breakfast: aggregates._sum.breakfast_balance || 0,
        classes: aggregates._sum.classes_balance || 0,
        water: aggregates._sum.water_balance || 0,
        transport: aggregates._sum.transport_balance || 0,
      },
      recentTransactions,
      recentTopUps,
    });
  } catch (error) {
    console.error('Error fetching credits:', error);
    return NextResponse.json({ error: 'Failed to fetch credit data' }, { status: 500 });
  }
}

// POST /api/accountant/credits - Top up student credit
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, feeding, breakfast, classes, water, transport, paymentMethod, note } = body;

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const totalAmount = (parseFloat(feeding) || 0) + (parseFloat(breakfast) || 0) +
      (parseFloat(classes) || 0) + (parseFloat(water) || 0) + (parseFloat(transport) || 0);

    if (totalAmount <= 0) {
      return NextResponse.json({ error: 'Top-up amount must be greater than zero' }, { status: 400 });
    }

    const student = await db.student.findUnique({
      where: { student_id: parseInt(studentId) },
      select: { student_id: true, name: true },
    });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Upsert wallet
    await db.daily_fee_wallet.upsert({
      where: { student_id: parseInt(studentId) },
      create: {
        student_id: parseInt(studentId),
        feeding_balance: parseFloat(feeding) || 0,
        breakfast_balance: parseFloat(breakfast) || 0,
        classes_balance: parseFloat(classes) || 0,
        water_balance: parseFloat(water) || 0,
        transport_balance: parseFloat(transport) || 0,
      },
      update: {
        feeding_balance: { increment: parseFloat(feeding) || 0 },
        breakfast_balance: { increment: parseFloat(breakfast) || 0 },
        classes_balance: { increment: parseFloat(classes) || 0 },
        water_balance: { increment: parseFloat(water) || 0 },
        transport_balance: { increment: parseFloat(transport) || 0 },
      },
    });

    // Generate transaction code
    const lastTx = await db.daily_fee_transactions.findFirst({
      orderBy: { id: 'desc' },
      select: { transaction_code: true },
    });
    let txCode = 'TXN-100001';
    if (lastTx?.transaction_code) {
      const num = parseInt(lastTx.transaction_code.replace(/\D/g, ''));
      if (!isNaN(num)) txCode = `TXN-${num + 1}`;
    }

    // Create transaction record
    await db.daily_fee_transactions.create({
      data: {
        transaction_code: txCode,
        student_id: parseInt(studentId),
        payment_date: new Date(),
        feeding_amount: parseFloat(feeding) || 0,
        breakfast_amount: parseFloat(breakfast) || 0,
        classes_amount: parseFloat(classes) || 0,
        water_amount: parseFloat(water) || 0,
        transport_amount: parseFloat(transport) || 0,
        total_amount: totalAmount,
        payment_type: 'topup',
        payment_method: paymentMethod || 'cash',
        year: new Date().getFullYear().toString(),
        term: '',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully topped up ${student.name} with ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'GHS' }).format(totalAmount)}`,
      transactionCode: txCode,
    });
  } catch (error: any) {
    console.error('Error topping up credits:', error);
    return NextResponse.json({ error: error.message || 'Failed to top up credits' }, { status: 500 });
  }
}
