import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    const parents = await db.parent.findMany({
      where,
      include: {
        students: { select: { student_id: true, name: true, student_code: true } },
      },
      orderBy: { parent_id: 'desc' },
    })

    return NextResponse.json(parents)
  } catch (error) {
    console.error('Error fetching parents:', error)
    return NextResponse.json({ error: 'Failed to fetch parents' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, guardian_gender, email, phone, address, profession, father_name, father_phone, mother_name, mother_phone } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Parent name is required' }, { status: 400 })
    }

    const parent = await db.parent.create({
      data: {
        name: name.trim(),
        guardian_gender: guardian_gender || '',
        email: email?.trim() || '',
        phone: phone || '',
        address: address || '',
        profession: profession || '',
        father_name: father_name || '',
        father_phone: father_phone || '',
        mother_name: mother_name || '',
        mother_phone: mother_phone || '',
        active_status: 1,
      },
      include: { students: { select: { student_id: true, name: true, student_code: true } } },
    })

    return NextResponse.json(parent, { status: 201 })
  } catch (error) {
    console.error('Error creating parent:', error)
    return NextResponse.json({ error: 'Failed to create parent' }, { status: 500 })
  }
}
