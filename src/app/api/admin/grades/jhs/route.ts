import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/grades/jhs - List all JHS grades (grade_2)
export async function GET() {
  try {
    const grades = await db.grade_2.findMany({
      orderBy: [{ grade_from: 'desc' }],
    })
    return NextResponse.json({ grades })
  } catch (error) {
    console.error('JHS grades GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch JHS grades' }, { status: 500 })
  }
}

// POST /api/admin/grades/jhs - Create a new JHS grade
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, grade_from, grade_to, comment, point } = body

    if (!name || grade_from === undefined || grade_to === undefined) {
      return NextResponse.json({ error: 'Name, grade_from, and grade_to are required' }, { status: 400 })
    }

    const grade = await db.grade_2.create({
      data: {
        name,
        grade_from: parseFloat(grade_from),
        grade_to: parseFloat(grade_to),
        comment: comment || '',
        point: point !== undefined ? parseFloat(point) : 0,
      },
    })

    return NextResponse.json(grade, { status: 201 })
  } catch (error) {
    console.error('JHS grades POST error:', error)
    return NextResponse.json({ error: 'Failed to create JHS grade' }, { status: 500 })
  }
}
