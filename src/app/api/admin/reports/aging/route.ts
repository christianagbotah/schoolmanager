import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const now = new Date();

    const overdueInvoices = await db.invoice.findMany({
      where: {
        status: { in: ['unpaid', 'overdue'] },
        due: { gt: 0 },
      },
      include: {
        student: { select: { name: true, student_code: true } },
      },
      orderBy: { creation_timestamp: 'asc' },
    });

    const aging = {
      current: 0,
      days30: 0,
      days60: 0,
      days90Plus: 0,
      total: 0,
      items: [] as { studentName: string; studentCode: string; invoiceCode: string; amount: number; days: number; createdDate: string }[],
    };

    for (const inv of overdueInvoices) {
      const createdDate = inv.creation_timestamp ? new Date(inv.creation_timestamp) : now;
      const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

      const item = {
        studentName: inv.student.name,
        studentCode: inv.student.student_code,
        invoiceCode: inv.invoice_code,
        amount: inv.due,
        days: Math.max(0, daysDiff),
        createdDate: inv.creation_timestamp ? inv.creation_timestamp.toISOString() : now.toISOString(),
      };

      if (daysDiff <= 30) aging.current += inv.due;
      else if (daysDiff <= 60) aging.days30 += inv.due;
      else if (daysDiff <= 90) aging.days60 += inv.due;
      else aging.days90Plus += inv.due;

      aging.total += inv.due;
      aging.items.push(item);
    }

    aging.items.sort((a, b) => b.amount - a.amount);

    return NextResponse.json(aging);
  } catch (error) {
    console.error('Error fetching aging report:', error);
    return NextResponse.json({ error: 'Failed to fetch aging report' }, { status: 500 });
  }
}
