import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/inventory/pos/receipt?saleId=1 — fetch receipt data for a sale
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const saleId = searchParams.get('saleId')

    if (!saleId) {
      return NextResponse.json({ error: 'saleId is required' }, { status: 400 })
    }

    const sale = await db.pos_sales.findUnique({
      where: { id: parseInt(saleId) },
      include: { items: true },
    })

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    return NextResponse.json(sale)
  } catch (error) {
    console.error('Receipt GET error:', error)
    return NextResponse.json({ error: 'Failed to load receipt' }, { status: 500 })
  }
}
