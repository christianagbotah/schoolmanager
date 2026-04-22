import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/inventory/pos — fetch POS data (products, categories, recent sales)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const [products, categories, recentSales] = await Promise.all([
      db.inventory_products.findMany({
        include: { category: true },
        orderBy: { name: 'asc' },
        where: { quantity: { gt: 0 } },
      }),
      db.inventory_categories.findMany({
        where: { is_active: 1 },
        orderBy: { name: 'asc' },
      }),
      db.pos_sales.findMany({
        include: { items: true },
        orderBy: { sale_date: 'desc' },
        take: 10,
      }),
    ])

    return NextResponse.json({
      products,
      categories,
      recentSales,
    })
  } catch (error) {
    console.error('POS GET error:', error)
    return NextResponse.json({ error: 'Failed to load POS data' }, { status: 500 })
  }
}

// POST /api/admin/inventory/pos — process a sale
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      items,
      customer_type = 'guest',
      customer_id = null,
      customer_name = '',
      payment_method = 'cash',
      discount_amount = 0,
      amount_tendered = 0,
      cashier_name = 'Admin',
    } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart items are required' }, { status: 400 })
    }

    // Validate stock availability and compute totals
    let subtotal = 0
    const validatedItems: { product_id: number; product_name: string; quantity: number; unit_price: number; subtotal: number }[] = []

    for (const item of items) {
      const product = await db.inventory_products.findUnique({
        where: { id: parseInt(item.product_id) },
      })

      if (!product) {
        return NextResponse.json(
          { error: `Product #${item.product_id} not found` },
          { status: 404 },
        )
      }

      const qty = parseInt(item.quantity) || 1

      if (product.quantity < qty) {
        return NextResponse.json(
          { error: `Insufficient stock for "${product.name}". Available: ${product.quantity}` },
          { status: 400 },
        )
      }

      const unitPrice = parseFloat(item.unit_price) || product.selling_price
      const lineSubtotal = unitPrice * qty
      subtotal += lineSubtotal

      validatedItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: qty,
        unit_price: unitPrice,
        subtotal: lineSubtotal,
      })
    }

    // Compute VAT (12.5% Ghana standard) and totals
    const discount = parseFloat(discount_amount) || 0
    const afterDiscount = Math.max(0, subtotal - discount)
    const vatAmount = Math.round(afterDiscount * 0.125 * 100) / 100
    const totalAmount = Math.round((afterDiscount + vatAmount) * 100) / 100
    const tendered = parseFloat(amount_tendered) || totalAmount
    const changeAmount = Math.round(Math.max(0, tendered - totalAmount) * 100) / 100

    // Generate receipt number
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '')
    const receiptNumber = `POS-${dateStr}-${timeStr}`

    // Create sale record
    const sale = await db.pos_sales.create({
      data: {
        receipt_number: receiptNumber,
        sale_date: now,
        customer_type,
        customer_id: customer_id ? parseInt(customer_id) : null,
        customer_name: customer_name || '',
        subtotal: Math.round(subtotal * 100) / 100,
        discount_amount: Math.round(discount * 100) / 100,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        payment_method,
        amount_tendered: Math.round(tendered * 100) / 100,
        change_amount: changeAmount,
        cashier_name,
        status: 'completed',
      },
    })

    // Create sale line items and update stock
    for (const vItem of validatedItems) {
      await db.pos_sale_items.create({
        data: {
          sale_id: sale.id,
          product_id: vItem.product_id,
          product_name: vItem.product_name,
          quantity: vItem.quantity,
          unit_price: vItem.unit_price,
          subtotal: vItem.subtotal,
        },
      })

      // Decrement stock
      await db.inventory_products.update({
        where: { id: vItem.product_id },
        data: { quantity: { decrement: vItem.quantity } },
      })

      // Log stock movement
      const currentProduct = await db.inventory_products.findUnique({
        where: { id: vItem.product_id },
      })
      await db.inventory_stock_movements.create({
        data: {
          product_id: vItem.product_id,
          movement_type: 'sale',
          quantity: vItem.quantity,
          previous_stock: (currentProduct?.quantity || 0) + vItem.quantity,
          new_stock: currentProduct?.quantity || 0,
          notes: `POS Sale #${sale.id}`,
          performed_by: cashier_name || 'admin',
          movement_date: new Date(),
        },
      })
    }

    // Return receipt data
    const completeSale = await db.pos_sales.findUnique({
      where: { id: sale.id },
      include: { items: true },
    })

    return NextResponse.json(completeSale, { status: 201 })
  } catch (error) {
    console.error('POS POST error:', error)
    return NextResponse.json({ error: 'Failed to process sale' }, { status: 500 })
  }
}
