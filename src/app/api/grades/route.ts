import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/grades
export async function GET() {
  try {
    const grades = await db.grade.findMany({
      orderBy: [{ grade_from: 'desc' }],
    })
    return NextResponse.json({ grades })
  } catch (error) {
    console.error('Grades GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 })
  }
}

// POST /api/grades
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, comment, grade_from, grade_to } = body

    if (!name || grade_from === undefined || grade_to === undefined) {
      return NextResponse.json({ error: 'Name, grade_from, and grade_to are required' }, { status: 400 })
    }

    const grade = await db.grade.create({
      data: {
        name,
        comment: comment || '',
        grade_from: parseFloat(grade_from),
        grade_to: parseFloat(grade_to),
      },
    })

    return NextResponse.json(grade, { status: 201 })
  } catch (error) {
    console.error('Grades POST error:', error)
    return NextResponse.json({ error: 'Failed to create grade' }, { status: 500 })
  }
}
