import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year') || '';
    const term = searchParams.get('term') || '';

    // Get running year/term from settings
    const settings = await db.settings.findMany({
      where: { type: { in: ['running_year', 'running_term', 'currency'] } },
    });
    const getSetting = (type: string) => settings.find(s => s.type === type)?.description || '';
    const runningYear = year || getSetting('running_year');
    const runningTerm = term || getSetting('running_term');
    const currency = getSetting('currency') || 'GHS';

    // Income overview stats
    const [
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      todayCollection,
      monthCollection,
      invoiceCount,
      paymentCount,
      paidCount,
      unpaidCount,
      partialCount,
    ] = await Promise.all([
      db.invoice.aggregate({ where: { can_delete: { not: 'trash' } }, _sum: { amount: true } }),
      db.invoice.aggregate({ where: { can_delete: { not: 'trash' } }, _sum: { amount_paid: true } }),
      db.invoice.aggregate({ where: { can_delete: { not: 'trash' }, due: { gt: 0 } }, _sum: { due: true } }),
      (() => {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const end = new Date(); end.setHours(23, 59, 59, 999);
        return db.payment.aggregate({ where: { timestamp: { gte: start, lte: end } }, _sum: { amount: true } });
      })(),
      (() => {
        const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
        const end = new Date(); end.setHours(23, 59, 59, 999);
        return db.payment.aggregate({ where: { timestamp: { gte: start, lte: end } }, _sum: { amount: true } });
      })(),
      db.invoice.count({ where: { can_delete: { not: 'trash' } } }),
      db.payment.count(),
      db.invoice.count({ where: { status: 'paid', can_delete: { not: 'trash' } } }),
      db.invoice.count({ where: { status: 'unpaid', can_delete: { not: 'trash' } } }),
      db.invoice.count({ where: { status: 'partial', can_delete: { not: 'trash' } } }),
    ]);

    // Monthly breakdown for current year
    const monthlyData = await db.$queryRaw<any[]>`
      SELECT 
        CAST(strftime('%m', timestamp) AS INTEGER) as month,
        SUM(amount) as total
      FROM payment
      WHERE strftime('%Y', timestamp) = ${runningYear.split('-')[0]}
      GROUP BY strftime('%m', timestamp)
      ORDER BY month ASC
    `;

    // Payment methods breakdown
    const methodBreakdown = await db.payment.groupBy({
      by: ['payment_method'],
      _sum: { amount: true },
    });

    // Top students by amount owed
    const topDebtors = await db.$queryRaw<any[]>`
      SELECT s.student_id, s.name, s.student_code,
             SUM(i.due) as total_owed,
             c.name as class_name
      FROM invoice i
      INNER JOIN student s ON i.student_id = s.student_id
      LEFT JOIN class c ON i.class_id = c.class_id
      WHERE i.due > 0 AND i.can_delete != 'trash'
      GROUP BY i.student_id
      ORDER BY total_owed DESC
      LIMIT 10
    `;

    // Recent payments (last 10)
    const recentPayments = await db.payment.findMany({
      take: 10,
      include: {
        student: { select: { name: true, student_code: true } },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Collection by class
    const classBreakdown = await db.$queryRaw<any[]>`
      SELECT c.name as class_name, c.class_id,
             COUNT(DISTINCT i.invoice_id) as invoice_count,
             SUM(i.amount) as total_billed,
             SUM(i.amount_paid) as total_collected,
             SUM(CASE WHEN i.due > 0 THEN i.due ELSE 0 END) as total_outstanding
      FROM invoice i
      INNER JOIN class c ON i.class_id = c.class_id
      WHERE i.can_delete != 'trash'
      GROUP BY i.class_id
      ORDER BY total_collected DESC
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
        collectionRate: totalInvoiced._sum.amount > 0 ? ((totalCollected._sum.amount || 0) / totalInvoiced._sum.amount * 100) : 0,
      },
      invoiceStats: { total: invoiceCount, paid: paidCount, unpaid: unpaidCount, partial: partialCount },
      paymentStats: { total: paymentCount },
      monthlyData: monthlyData.map(m => ({ month: m.month, total: m.total || 0 })),
      methodBreakdown: methodBreakdown.map(m => ({ method: m.payment_method, total: m._sum.amount || 0 })),
      topDebtors,
      recentPayments,
      classBreakdown,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch income data' }, { status: 500 });
  }
}
