import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/daily-fees/wallet?student_id=X - Get student wallet
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = parseInt(searchParams.get('student_id') || '0');
    if (!studentId) {
      return NextResponse.json({ error: 'student_id required' }, { status: 400 });
    }

    let wallet = await db.daily_fee_wallet.findUnique({
      where: { student_id: studentId },
    });

    // Get student's class and rates
    const enroll = await db.enroll.findFirst({
      where: { student_id: studentId },
      include: {
        class: {
          include: {
            daily_fee_rates: true,
          },
        },
      },
      orderBy: { enroll_id: 'desc' },
    });

    let rates = null;
    if (enroll?.class?.daily_fee_rates && enroll.class.daily_fee_rates.length > 0) {
      rates = enroll.class.daily_fee_rates[0];
    }

    // Auto-create wallet if not exists
    if (!wallet) {
      const settings = await db.settings.findMany({
        where: { type: { in: ['running_year', 'running_term'] } },
      });
      let year = '', term = '';
      settings.forEach((s: any) => {
        if (s.type === 'running_year') year = s.description;
        if (s.type === 'running_term') term = s.description;
      });

      wallet = await db.daily_fee_wallet.create({
        data: { student_id: studentId },
      });
    }

    return NextResponse.json({ wallet, rates, class: enroll?.class || null });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
