import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    const where: Record<string, unknown> = {};

    // Fetch from settings for SMS log (using notice check_sms field as indicator)
    // Since there's no dedicated SMS table, we use daily_fee_transactions with payment_method='sms'
    const skip = (page - 1) * limit;

    const smsTransactions = await db.daily_fee_transactions.findMany({
      where: {
        payment_method: 'sms',
      },
      orderBy: { id: 'desc' },
      skip,
      take: limit,
    });

    const total = await db.daily_fee_transactions.count({
      where: { payment_method: 'sms' },
    });

    const logs = smsTransactions.map((t, i) => ({
      id: t.id,
      recipient: t.transaction_code.replace('SMS-', '') || 'Unknown',
      recipient_type: t.collected_by || 'general',
      message: `SMS notification - ${t.transaction_code}`,
      status: t.total_amount > 0 ? 'delivered' : 'failed',
      sent_at: t.payment_date ? t.payment_date.toISOString() : new Date().toISOString(),
      sent_by: t.collected_by || 'System',
    }));

    // Apply filters
    let filtered = logs;
    if (status) {
      filtered = logs.filter(l => l.status === status);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(l =>
        l.recipient.toLowerCase().includes(s) ||
        l.message.toLowerCase().includes(s)
      );
    }

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({ logs: filtered, totalPages, total });
  } catch (error) {
    console.error('Error fetching SMS log:', error);
    return NextResponse.json({ error: 'Failed to fetch SMS log' }, { status: 500 });
  }
}
