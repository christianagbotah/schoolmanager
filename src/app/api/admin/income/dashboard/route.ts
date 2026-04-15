import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/income/dashboard - Income dashboard data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || '';
    const term = searchParams.get('term') || '';

    const settings = await db.settings.findMany({
      where: { type: { in: ['running_year', 'running_term', 'currency'] } },
    });
    const getSetting = (type: string) => settings.find(s => s.type === type)?.description || '';
    const runningYear = year || getSetting('running_year');
    const runningTerm = term || getSetting('running_term');
    const currency = getSetting('currency') || 'GHS';

    // Invoice statistics
    const [totalInvoiced, totalCollected, totalOutstanding] = await Promise.all([
      db.invoice.aggregate({ where: { can_delete: { not: 'trash' } }, _sum: { amount: true } }),
      db.invoice.aggregate({ where: { can_delete: { not: 'trash' } }, _sum: { amount_paid: true } }),
      db.invoice.aggregate({ where: { can_delete: { not: 'trash' }, due: { gt: 0 } }, _sum: { due: true } }),
    ]);

    const [invoiceCount, paidCount, unpaidCount, partialCount] = await Promise.all([
      db.invoice.count({ where: { can_delete: { not: 'trash' } } }),
      db.invoice.count({ where: { status: 'paid', can_delete: { not: 'trash' } } }),
      db.invoice.count({ where: { status: 'unpaid', can_delete: { not: 'trash' } } }),
      db.invoice.count({ where: { status: 'partial', can_delete: { not: 'trash' } } }),
    ]);

    // Today's collections
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const todayCollection = await db.payment.aggregate({
      where: { timestamp: { gte: todayStart, lte: todayEnd } },
      _sum: { amount: true },
    });

    // This month
    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
    const monthCollection = await db.payment.aggregate({
      where: { timestamp: { gte: monthStart, lte: todayEnd } },
      _sum: { amount: true },
    });

    // Monthly trend (last 6 months)
    const monthlyTrend = await db.$queryRaw<any[]>`
      SELECT 
        CAST(strftime('%m', timestamp) AS INTEGER) as month,
        CAST(strftime('%Y', timestamp) AS INTEGER) as year,
        SUM(amount) as total,
        COUNT(*) as count
      FROM payment
      WHERE timestamp >= date('now', '-5 months')
      GROUP BY strftime('%Y-%m', timestamp)
      ORDER BY year ASC, month ASC
    `;

    // Payment method breakdown
    const methodBreakdown = await db.payment.groupBy({
      by: ['payment_method'],
      _sum: { amount: true },
      _count: { id: true },
    });

    // Recent payments
    const recentPayments = await db.payment.findMany({
      take: 15,
      include: {
        student: { select: { name: true, student_code: true } },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Receivables by class
    const receivablesByClass = await db.$queryRaw<any[]>`
      SELECT c.name as class_name, c.class_id,
             COUNT(DISTINCT i.invoice_id) as invoice_count,
             SUM(CASE WHEN i.due > 0 THEN i.due ELSE 0 END) as outstanding,
             SUM(i.amount) as total_billed,
             SUM(i.amount_paid) as total_collected
      FROM invoice i
      INNER JOIN class c ON i.class_id = c.class_id
      WHERE i.can_delete != 'trash'
      GROUP BY i.class_id
      ORDER BY outstanding DESC
      LIMIT 20
    `;

    // Top debtors
    const topDebtors = await db.$queryRaw<any[]>`
      SELECT s.student_id, s.name, s.student_code,
             SUM(i.due) as total_owed,
             COUNT(i.invoice_id) as unpaid_invoices
      FROM invoice i
      INNER JOIN student s ON i.student_id = s.student_id
      WHERE i.due > 0 AND i.can_delete != 'trash'
      GROUP BY i.student_id
      ORDER BY total_owed DESC
      LIMIT 10
    `;

    return NextResponse.json({
      currency,
      runningYear,
      runningTerm,
      overview: {
        totalInvoiced: totalInvoiced._sum.amount || 0,
        totalCollected: totalCollected._sum.amount || 0,
        totalOutstanding: totalOutstanding._sum.due || 0,
        todayCollection: todayCollection._sum.amount || 0,
        monthCollection: monthCollection._sum.amount || 0,
        collectionRate: totalInvoiced._sum.amount > 0
          ? ((totalCollected._sum.amount || 0) / totalInvoiced._sum.amount * 100)
          : 0,
      },
      invoiceStats: { total: invoiceCount, paid: paidCount, unpaid: unpaidCount, partial: partialCount },
      monthlyTrend,
      methodBreakdown: methodBreakdown.map(m => ({
        method: m.payment_method || 'other',
        total: m._sum.amount || 0,
        count: m._count.id,
      })),
      recentPayments,
      receivablesByClass,
      topDebtors,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
