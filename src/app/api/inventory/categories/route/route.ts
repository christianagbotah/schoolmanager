import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const categories = await db.inventory_categories.findMany({
    include: { products: true },
    orderBy: { id: 'desc' },
  })

  return NextResponse.json(categories)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { name, description } = body

  if (!name) {
    return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
  }

  const category = await db.inventory_categories.create({
    data: {
      name,
      description: description || '',
      is_active: 1,
    },
  })

  return NextResponse.json(category, { status: 201 })
}

export async function PUT(req: Request) {
  const body = await req.json()
  const { id, ...data } = body

  if (!id) {
    return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
  }

  const category = await db.inventory_categories.update({
    where: { id: parseInt(id) },
    data: {
      name: data.name,
      description: data.description || '',
      is_active: data.is_active !== undefined ? (data.is_active ? 1 : 0) : undefined,
    },
  })

  return NextResponse.json(category)
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await db.inventory_products.updateMany({
    where: { category_id: parseInt(id) },
    data: { category_id: null },
  })
  await db.inventory_categories.delete({ where: { id: parseInt(id) } })

  return NextResponse.json({ success: true })
}
