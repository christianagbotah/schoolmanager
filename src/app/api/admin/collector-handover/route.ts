import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/collector-handover - Get handover records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || '';
    const status = searchParams.get('status') || '';

    const where: any = {};
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.handover_date = { gte: start, lte: end };
    }
    if (status) where.status = status;

    const handovers = await db.collector_handover.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 100,
    });

    // Also compute today's actual collections per collector for context
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const todayTx = await db.daily_fee_transactions.findMany({
      where: { payment_date: { gte: today, lte: endOfDay } },
    });

    const collectorSummary = new Map<string, { cash: number; momo: number; bank: number; total: number; count: number }>();
    todayTx.forEach(tx => {
      const collector = tx.collected_by || 'Unknown';
      const existing = collectorSummary.get(collector) || { cash: 0, momo: 0, bank: 0, total: 0, count: 0 };
      existing.total += tx.total_amount;
      existing.count++;
      const method = tx.payment_method.toLowerCase();
      if (method.includes('cash')) existing.cash += tx.total_amount;
      else if (method.includes('momo') || method.includes('mobile')) existing.momo += tx.total_amount;
      else if (method.includes('bank')) existing.bank += tx.total_amount;
      collectorSummary.set(collector, existing);
    });

    const collectorsToday = Array.from(collectorSummary.entries()).map(([name, data]) => ({
      name,
      ...data,
    }));

    // Pending handovers count
    const pendingCount = await db.collector_handover.count({ where: { status: 'pending' } });
    const verifiedCount = await db.collector_handover.count({ where: { status: 'verified' } });

    return NextResponse.json({
      handovers,
      collectorsToday,
      stats: { pending: pendingCount, verified: verifiedCount, total: handovers.length },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/collector-handover - Create or verify handover
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, from_collector, to_collector, cash_amount, momo_amount, bank_amount, notes, verified_by } = body;

    if (action === 'create') {
      if (!from_collector || !to_collector) {
        return NextResponse.json({ error: 'from_collector and to_collector required' }, { status: 400 });
      }

      const total = (cash_amount || 0) + (momo_amount || 0) + (bank_amount || 0);

      const handover = await db.collector_handover.create({
        data: {
          from_collector,
          to_collector,
          cash_amount: cash_amount || 0,
          momo_amount: momo_amount || 0,
          bank_amount: bank_amount || 0,
          total_amount: total,
          transaction_count: 0,
          notes: notes || '',
          status: 'pending',
        },
      });

      return NextResponse.json({ status: 'success', message: 'Handover record created', handover });
    }

    if (action === 'verify') {
      if (!id) {
        return NextResponse.json({ error: 'id required' }, { status: 400 });
      }

      const handover = await db.collector_handover.update({
        where: { id },
        data: {
          status: 'verified',
          verified_by: verified_by || 'Admin',
          verified_at: new Date(),
        },
      });

      return NextResponse.json({ status: 'success', message: 'Handover verified', handover });
    }

    if (action === 'reject') {
      if (!id) {
        return NextResponse.json({ error: 'id required' }, { status: 400 });
      }

      const handover = await db.collector_handover.update({
        where: { id },
        data: {
          status: 'rejected',
          verified_by: verified_by || 'Admin',
          verified_at: new Date(),
        },
      });

      return NextResponse.json({ status: 'success', message: 'Handover rejected', handover });
    }

    return NextResponse.json({ error: 'Invalid action. Use create, verify, or reject.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
