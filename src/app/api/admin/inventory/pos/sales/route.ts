import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/inventory/pos/sales — sales history with filters and summary
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const paymentMethod = searchParams.get('paymentMethod')
    const customerType = searchParams.get('customerType')
    const cashier = searchParams.get('cashier')

    const where: Record<string, unknown> = { status: 'completed' }

    if (startDate || endDate) {
      where.sale_date = {}
      if (startDate) (where.sale_date as Record<string, unknown>).gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        ;(where.sale_date as Record<string, unknown>).lte = end
      }
    }
    if (paymentMethod && paymentMethod !== 'all') where.payment_method = paymentMethod
    if (customerType && customerType !== 'all') where.customer_type = customerType
    if (cashier) where.cashier_name = { contains: cashier }

    const [sales, totalCount, dailySummary] = await Promise.all([
      db.pos_sales.findMany({
        where,
        include: { items: true },
        orderBy: { sale_date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.pos_sales.count({ where }),
      // Daily summary for today
      db.pos_sales.aggregate({
        where: {
          status: 'completed',
          sale_date: {
            gte: new Date(new Date().toISOString().slice(0, 10)),
          },
        },
        _count: true,
        _sum: { total_amount: true, discount_amount: true, vat_amount: true },
      }),
    ])

    // Weekly summary
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weeklySummary = await db.pos_sales.aggregate({
      where: {
        status: 'completed',
        sale_date: { gte: weekAgo },
      },
      _count: true,
      _sum: { total_amount: true },
    })

    // Monthly summary
    const monthAgo = new Date()
    monthAgo.setDate(monthAgo.getDate() - 30)
    const monthlySummary = await db.pos_sales.aggregate({
      where: {
        status: 'completed',
        sale_date: { gte: monthAgo },
      },
      _count: true,
      _sum: { total_amount: true },
    })

    return NextResponse.json({
      sales,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      summaries: {
        daily: {
          count: dailySummary._count,
          total: dailySummary._sum.total_amount || 0,
          discount: dailySummary._sum.discount_amount || 0,
          vat: dailySummary._sum.vat_amount || 0,
        },
        weekly: {
          count: weeklySummary._count,
          total: weeklySummary._sum.total_amount || 0,
        },
        monthly: {
          count: monthlySummary._count,
          total: monthlySummary._sum.total_amount || 0,
        },
      },
    })
  } catch (error) {
    console.error('Sales history GET error:', error)
    return NextResponse.json({ error: 'Failed to load sales history' }, { status: 500 })
  }
}
