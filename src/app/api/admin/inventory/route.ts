import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/inventory - products, categories, sales, stats, stock movements, suppliers
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action') || ''

  if (action === 'suppliers') {
    const suppliers = await db.inventory_suppliers.findMany({
      orderBy: { supplier_id: 'desc' },
    })
    return NextResponse.json(suppliers)
  }

  if (action === 'stock_movements') {
    const movements = await db.inventory_stock_movements.findMany({
      orderBy: { movement_date: 'desc' },
      take: 100,
    })
    return NextResponse.json(movements)
  }

  if (action === 'stats') {
    const products = await db.inventory_products.count()
    const categories = await db.inventory_categories.count()
    const lowStock = await db.inventory_products.count({ where: { quantity: { lte: 5 } } })
    const totalValue = await db.inventory_products.aggregate({
      _sum: { selling_price: true },
    })
    const totalStockValue = await db.inventory_products.aggregate({
      _sum: { cost_price: true },
    })
    const totalSales = await db.inventory_sales.aggregate({
      _sum: { total_amount: true },
    })
    const suppliers = await db.inventory_suppliers.count()

    return NextResponse.json({
      products, categories, lowStock, suppliers,
      totalValue: totalValue._sum.selling_price || 0,
      totalStockValue: totalStockValue._sum.cost_price || 0,
      totalSales: totalSales._sum.total_amount || 0,
    })
  }

  // Default: everything
  const [products, categories, sales, suppliers, movements] = await Promise.all([
    db.inventory_products.findMany({
      include: { category: true },
      orderBy: { id: 'desc' },
      take: 200,
    }),
    db.inventory_categories.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { id: 'desc' },
    }),
    db.inventory_sales.findMany({
      include: {
        sale_items: { include: { product: true } },
        student: { select: { name: true, student_code: true } },
      },
      orderBy: { id: 'desc' },
      take: 100,
    }),
    db.inventory_suppliers.findMany({ orderBy: { supplier_id: 'desc' } }),
    db.inventory_stock_movements.findMany({ orderBy: { movement_date: 'desc' }, take: 50 }),
  ])

  const totalValue = products.reduce((s, p) => s + p.selling_price * p.quantity, 0)
  const lowStock = products.filter(p => p.quantity <= 5).length
  const totalSales = sales.reduce((s, sl) => s + sl.total_amount, 0)

  return NextResponse.json({ products, categories, sales, suppliers, movements, stats: { totalValue, lowStock, totalSales } })
}

// POST /api/admin/inventory - create product, category, sale, supplier, stock movement
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action } = body

  if (action === 'create_product') {
    const { name, sku, description, category_id, cost_price, selling_price, quantity, unit } = body
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
    const product = await db.inventory_products.create({
      data: {
        name, sku: sku || '', description: description || '',
        category_id: category_id ? parseInt(category_id) : null,
        cost_price: parseFloat(cost_price) || 0,
        selling_price: parseFloat(selling_price) || 0,
        quantity: parseInt(quantity) || 0,
        unit: unit || 'pcs',
      },
    })
    return NextResponse.json(product, { status: 201 })
  }

  if (action === 'update_product') {
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const product = await db.inventory_products.update({
      where: { id: parseInt(id) },
      data: {
        name: data.name, sku: data.sku || '', description: data.description || '',
        category_id: data.category_id ? parseInt(data.category_id) : null,
        cost_price: parseFloat(data.cost_price) || 0,
        selling_price: parseFloat(data.selling_price) || 0,
        quantity: data.quantity !== undefined ? parseInt(data.quantity) : undefined,
        unit: data.unit || 'pcs',
      },
    })
    return NextResponse.json(product)
  }

  if (action === 'delete_product') {
    const { id } = body
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.inventory_sale_items.deleteMany({ where: { product_id: parseInt(id) } })
    await db.inventory_products.delete({ where: { id: parseInt(id) } })
    return NextResponse.json({ success: true })
  }

  if (action === 'create_category') {
    const { name, description } = body
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
    const cat = await db.inventory_categories.create({
      data: { name, description: description || '' },
    })
    return NextResponse.json(cat, { status: 201 })
  }

  if (action === 'create_sale') {
    const { student_id, payment_method, items } = body
    if (!items?.length) return NextResponse.json({ error: 'Items required' }, { status: 400 })

    const sale = await db.inventory_sales.create({
      data: {
        student_id: student_id ? parseInt(student_id) : null,
        sale_date: new Date(),
        payment_method: payment_method || 'cash',
        status: 'completed',
        total_amount: 0,
      },
    })

    let total = 0
    for (const item of items) {
      const product = await db.inventory_products.findUnique({ where: { id: parseInt(item.product_id) } })
      if (!product) continue
      const unitPrice = parseFloat(item.unit_price) || product.selling_price
      const qty = parseInt(item.quantity) || 1
      const subtotal = unitPrice * qty
      total += subtotal

      await db.inventory_sale_items.create({
        data: {
          sale_id: sale.id,
          product_id: parseInt(item.product_id),
          quantity: qty,
          unit_price: unitPrice,
          subtotal,
        },
      })

      // Decrease stock
      await db.inventory_products.update({
        where: { id: parseInt(item.product_id) },
        data: { quantity: { decrement: qty } },
      })

      // Log stock movement
      await db.inventory_stock_movements.create({
        data: {
          product_id: parseInt(item.product_id),
          movement_type: 'sale',
          quantity: qty,
          previous_stock: product.quantity,
          new_stock: Math.max(0, product.quantity - qty),
          notes: `Sale #${sale.id}`,
          performed_by: 'admin',
          movement_date: new Date(),
        },
      })
    }

    await db.inventory_sales.update({
      where: { id: sale.id },
      data: { total_amount: total },
    })

    return NextResponse.json(sale, { status: 201 })
  }

  if (action === 'create_supplier') {
    const { name, contact_name, phone, email, address } = body
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
    const supplier = await db.inventory_suppliers.create({
      data: { name, contact_name: contact_name || '', phone: phone || '', email: email || '', address: address || '' },
    })
    return NextResponse.json(supplier, { status: 201 })
  }

  if (action === 'add_stock') {
    const { product_id, quantity, unit_cost, notes } = body
    if (!product_id || !quantity) return NextResponse.json({ error: 'Product and quantity required' }, { status: 400 })

    const product = await db.inventory_products.findUnique({ where: { id: parseInt(product_id) } })
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    const newQty = parseInt(quantity)
    await db.inventory_products.update({
      where: { id: parseInt(product_id) },
      data: { quantity: { increment: newQty } },
    })

    const movement = await db.inventory_stock_movements.create({
      data: {
        product_id: parseInt(product_id),
        movement_type: 'restock',
        quantity: newQty,
        previous_stock: product.quantity,
        new_stock: product.quantity + newQty,
        unit_cost: parseFloat(unit_cost) || 0,
        notes: notes || 'Stock added',
        performed_by: 'admin',
        movement_date: new Date(),
      },
    })
    return NextResponse.json(movement, { status: 201 })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const id = searchParams.get('id')

  if (!action || !id) return NextResponse.json({ error: 'action and id required' }, { status: 400 })

  if (action === 'supplier') {
    await db.inventory_suppliers.delete({ where: { supplier_id: parseInt(id) } })
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
