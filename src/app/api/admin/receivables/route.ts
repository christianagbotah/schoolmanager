import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/receivables - accounts receivable management
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const class_id = searchParams.get('class_id')
  const status = searchParams.get('status') || ''

  const where: Record<string, unknown> = { due: { gt: 0 }, mute: 0 }
  if (class_id) where.class_id = parseInt(class_id)
  if (status === 'overdue') {
    where.creation_timestamp = { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  } else if (status === 'partial') {
    where.status = 'partial'
  } else if (status === 'unpaid') {
    where.status = 'unpaid'
  }

  const receivables = await db.invoice.findMany({
    where: Object.keys(where).length > 1 ? where : { due: { gt: 0 }, mute: 0 },
    include: {
      student: {
        select: { name: true, student_code: true, parent_id: true },
      },
      class: { select: { name: true } },
    },
    orderBy: { due: 'desc' },
    take: 200,
  })

  // Stats
  const totalReceivable = receivables.reduce((s, r) => s + r.due, 0)
  const totalBilled = receivables.reduce((s, r) => s + r.amount, 0)
  const totalCollected = receivables.reduce((s, r) => s + r.amount_paid, 0)
  const overdueCount = receivables.filter(r => {
    if (!r.creation_timestamp) return false
    return new Date(r.creation_timestamp) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  }).length

  // By class breakdown
  const classBreakdown: Record<string, number> = {}
  for (const r of receivables) {
    const cls = r.class?.name || 'Unclassified'
    classBreakdown[cls] = (classBreakdown[cls] || 0) + r.due
  }

  return NextResponse.json({
    receivables,
    stats: {
      totalReceivable,
      totalBilled,
      totalCollected,
      overdueCount,
      invoiceCount: receivables.length,
    },
    classBreakdown: Object.entries(classBreakdown)
      .map(([cls, amount]) => ({ class: cls, amount }))
      .sort((a, b) => b.amount - a.amount),
  })
}
