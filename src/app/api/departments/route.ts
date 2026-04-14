import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const departments = await db.department.findMany({
      orderBy: { id: 'asc' },
      include: {
        _count: { select: { teachers: true } },
      },
    })
    return NextResponse.json(departments)
  } catch (error) {
    console.error('Error fetching departments:', error)
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dep_name } = body

    if (!dep_name || !dep_name.trim()) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 })
    }

    const department = await db.department.create({
      data: { dep_name: dep_name.trim() },
    })

    return NextResponse.json(department, { status: 201 })
  } catch (error) {
    console.error('Error creating department:', error)
    return NextResponse.json({ error: 'Failed to create department' }, { status: 500 })
  }
}
