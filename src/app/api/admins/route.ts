import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const level = searchParams.get('level')

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ]
    }
    if (level) where.level = level

    const admins = await db.admin.findMany({
      where,
      orderBy: { admin_id: 'desc' },
    })

    return NextResponse.json(admins)
  } catch (error) {
    console.error('Error fetching admins:', error)
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, level, password } = body

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const existing = await db.admin.findFirst({ where: { email: email.trim() } })
    if (existing) {
      return NextResponse.json({ error: 'Admin with this email already exists' }, { status: 409 })
    }

    const adminCode = `ADM-${Date.now().toString(36).toUpperCase()}`

    const admin = await db.admin.create({
      data: {
        admin_code: adminCode,
        name: name.trim(),
        email: email.trim(),
        phone: phone || '',
        level: level || '5',
        password: password || '',
        active_status: 1,
      },
    })

    return NextResponse.json(admin, { status: 201 })
  } catch (error) {
    console.error('Error creating admin:', error)
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 })
  }
}
