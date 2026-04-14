import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type === 'categories') {
      const categories = await db.discount_categories.findMany({ orderBy: { category_id: 'desc' } })
      return NextResponse.json(categories)
    }

    if (type === 'profiles') {
      const profiles = await db.discount_profiles.findMany({ orderBy: { profile_id: 'desc' } })
      return NextResponse.json(profiles)
    }

    const [categories, profiles] = await Promise.all([
      db.discount_categories.findMany({ orderBy: { category_id: 'desc' } }),
      db.discount_profiles.findMany({ orderBy: { profile_id: 'desc' } }),
    ])

    return NextResponse.json({ categories, profiles })
  } catch (error) {
    console.error('Error fetching discounts:', error)
    return NextResponse.json({ error: 'Failed to fetch discounts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, action, ...data } = body

    if (type === 'category') {
      const { id, code, name, discount_type, description } = data
      if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

      if (id) {
        const updated = await db.discount_categories.update({ where: { category_id: id }, data: { code: code || '', name: name.trim(), discount_type: discount_type || 'percentage', description: description || '' } })
        return NextResponse.json(updated)
      }
      const created = await db.discount_categories.create({ data: { code: code || '', name: name.trim(), discount_type: discount_type || 'percentage', description: description || '', is_active: 1 } })
      return NextResponse.json(created, { status: 201 })
    }

    if (type === 'profile') {
      const { id, profile_name, discount_category, description, flat_amount, flat_percentage } = data
      if (!profile_name?.trim()) return NextResponse.json({ error: 'Profile name required' }, { status: 400 })

      if (id) {
        const updated = await db.discount_profiles.update({ where: { profile_id: id }, data: { profile_name: profile_name.trim(), discount_category: discount_category || '', description: description || '', flat_amount: parseFloat(flat_amount) || 0, flat_percentage: parseFloat(flat_percentage) || 0 } })
        return NextResponse.json(updated)
      }
      const created = await db.discount_profiles.create({ data: { profile_name: profile_name.trim(), discount_category: discount_category || '', description: description || '', flat_amount: parseFloat(flat_amount) || 0, flat_percentage: parseFloat(flat_percentage) || 0, is_active: 1 } })
      return NextResponse.json(created, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Error in discounts:', error)
    return NextResponse.json({ error: 'Failed to process discount' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = parseInt(searchParams.get('id') || '0')

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    if (type === 'category') {
      await db.discount_categories.delete({ where: { category_id: id } })
    } else if (type === 'profile') {
      await db.discount_profiles.delete({ where: { profile_id: id } })
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting discount:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
