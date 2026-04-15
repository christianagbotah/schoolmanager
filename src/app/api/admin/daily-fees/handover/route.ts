import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/daily-fees/handover - Cashier handover report for today
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || '';

    const today = date ? new Date(date) : new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all transactions for today
    const transactions = await db.daily_fee_transactions.findMany({
      where: { payment_date: { gte: today, lte: endOfDay } },
      include: {
        student: { select: { student_id: true, name: true, student_code: true } },
      },
      orderBy: { id: 'desc' },
    });

    // Aggregate by collector
    const collectorMap = new Map<string, any[]>();
    for (const tx of transactions) {
      const collector = tx.collected_by || 'Unknown';
      if (!collectorMap.has(collector)) collectorMap.set(collector, []);
      collectorMap.get(collector)!.push(tx);
    }

    const collectors = Array.from(collectorMap.entries()).map(([name, txs]) => {
      const cash = txs.filter(t => t.payment_method.toLowerCase().includes('cash'));
      const momo = txs.filter(t => t.payment_method.toLowerCase().includes('momo') || t.payment_method.toLowerCase().includes('mobile'));
      const bank = txs.filter(t => t.payment_method.toLowerCase().includes('bank'));
      const cheque = txs.filter(t => t.payment_method.toLowerCase().includes('cheque'));

      return {
        name,
        transactionCount: txs.length,
        totalCollected: txs.reduce((s, t) => s + t.total_amount, 0),
        feedingTotal: txs.reduce((s, t) => s + t.feeding_amount, 0),
        breakfastTotal: txs.reduce((s, t) => s + t.breakfast_amount, 0),
        classesTotal: txs.reduce((s, t) => s + t.classes_amount, 0),
        waterTotal: txs.reduce((s, t) => s + t.water_amount, 0),
        transportTotal: txs.reduce((s, t) => s + t.transport_amount, 0),
        cashTotal: cash.reduce((s, t) => s + t.total_amount, 0),
        cashCount: cash.length,
        momoTotal: momo.reduce((s, t) => s + t.total_amount, 0),
        momoCount: momo.length,
        bankTotal: bank.reduce((s, t) => s + t.total_amount, 0),
        bankCount: bank.length,
        chequeTotal: cheque.reduce((s, t) => s + t.total_amount, 0),
        chequeCount: cheque.length,
        transactions: txs,
      };
    });

    // Grand totals
    const grandTotal = {
      transactionCount: transactions.length,
      totalCollected: transactions.reduce((s, t) => s + t.total_amount, 0),
      feedingTotal: transactions.reduce((s, t) => s + t.feeding_amount, 0),
      breakfastTotal: transactions.reduce((s, t) => s + t.breakfast_amount, 0),
      classesTotal: transactions.reduce((s, t) => s + t.classes_amount, 0),
      waterTotal: transactions.reduce((s, t) => s + t.water_amount, 0),
      transportTotal: transactions.reduce((s, t) => s + t.transport_amount, 0),
      cashTotal: collectors.reduce((s, c) => s + c.cashTotal, 0),
      momoTotal: collectors.reduce((s, c) => s + c.momoTotal, 0),
      bankTotal: collectors.reduce((s, c) => s + c.bankTotal, 0),
      chequeTotal: collectors.reduce((s, c) => s + c.chequeTotal, 0),
    };

    return NextResponse.json({
      date: today.toISOString().split('T')[0],
      collectors,
      grandTotal,
      allTransactions: transactions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
