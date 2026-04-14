import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const designations = await db.designation.findMany({
      orderBy: { id: 'asc' },
      include: {
        _count: { select: { teachers: true } },
      },
    })
    return NextResponse.json(designations)
  } catch (error) {
    console.error('Error fetching designations:', error)
    return NextResponse.json({ error: 'Failed to fetch designations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { des_name } = body

    if (!des_name || !des_name.trim()) {
      return NextResponse.json({ error: 'Designation name is required' }, { status: 400 })
    }

    const designation = await db.designation.create({
      data: { des_name: des_name.trim() },
    })

    return NextResponse.json(designation, { status: 201 })
  } catch (error) {
    console.error('Error creating designation:', error)
    return NextResponse.json({ error: 'Failed to create designation' }, { status: 500 })
  }
}
