import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (status) where.status = status

  const sales = await db.inventory_sales.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    include: {
      sale_items: { include: { product: true } },
      student: { select: { student_id: true, name: true, student_code: true } },
    },
    orderBy: { id: 'desc' },
    take: 200,
  })

  return NextResponse.json(sales)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { student_id, items, payment_method } = body

  if (!items || !items.length) {
    return NextResponse.json({ error: 'Items are required' }, { status: 400 })
  }

  const total_amount = items.reduce((sum: number, item: any) => sum + item.quantity * item.unit_price, 0)

  // Create sale and items in transaction
  const sale = await db.$transaction(async (tx) => {
    const newSale = await tx.inventory_sales.create({
      data: {
        student_id: student_id ? parseInt(student_id) : null,
        sale_date: new Date(),
        total_amount,
        payment_method: payment_method || 'cash',
        status: 'completed',
      },
    })

    for (const item of items) {
      const subtotal = item.quantity * item.unit_price
      await tx.inventory_sale_items.create({
        data: {
          sale_id: newSale.id,
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(item.unit_price),
          subtotal,
        },
      })

      // Decrement product quantity
      await tx.inventory_products.update({
        where: { id: parseInt(item.product_id) },
        data: { quantity: { decrement: parseInt(item.quantity) } },
      })
    }

    return newSale
  })

  return NextResponse.json(sale, { status: 201 })
}
