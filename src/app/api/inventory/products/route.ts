import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const category_id = searchParams.get('category_id')

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { sku: { contains: search } },
    ]
  }
  if (category_id) where.category_id = parseInt(category_id)

  const products = await db.inventory_products.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    include: { category: true },
    orderBy: { id: 'desc' },
    take: 200,
  })

  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, sku, description, category_id, cost_price, selling_price, quantity, unit } = body

  if (!name) {
    return NextResponse.json({ error: 'Product name is required' }, { status: 400 })
  }

  const product = await db.inventory_products.create({
    data: {
      name,
      sku: sku || '',
      description: description || '',
      category_id: category_id ? parseInt(category_id) : null,
      cost_price: cost_price ? parseFloat(cost_price) : 0,
      selling_price: selling_price ? parseFloat(selling_price) : 0,
      quantity: quantity ? parseInt(quantity) : 0,
      unit: unit || 'pcs',
    },
  })

  return NextResponse.json(product, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body

  if (!id) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
  }

  const product = await db.inventory_products.update({
    where: { id: parseInt(id) },
    data: {
      name: data.name,
      sku: data.sku || '',
      description: data.description || '',
      category_id: data.category_id ? parseInt(data.category_id) : null,
      cost_price: data.cost_price ? parseFloat(data.cost_price) : 0,
      selling_price: data.selling_price ? parseFloat(data.selling_price) : 0,
      quantity: data.quantity !== undefined ? parseInt(data.quantity) : undefined,
      unit: data.unit || 'pcs',
    },
  })

  return NextResponse.json(product)
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await db.inventory_sale_items.deleteMany({ where: { product_id: parseInt(id) } })
  await db.inventory_products.delete({ where: { id: parseInt(id) } })

  return NextResponse.json({ success: true })
}
