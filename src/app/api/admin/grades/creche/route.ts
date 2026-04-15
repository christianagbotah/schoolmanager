import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/grades/creche - List all creche grades
export async function GET() {
  try {
    const grades = await db.grade_creche.findMany({
      orderBy: { grade_creche_id: 'asc' },
    })
    return NextResponse.json({ grades })
  } catch (error) {
    console.error('Creche grades GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch creche grades' }, { status: 500 })
  }
}

// POST /api/admin/grades/creche - Create a new creche grade
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, abbrev } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Grade name is required' }, { status: 400 })
    }

    const grade = await db.grade_creche.create({
      data: {
        name: name.toUpperCase(),
        abbrev: abbrev?.toUpperCase() || '',
      },
    })

    return NextResponse.json({ success: true, grade })
  } catch (error) {
    console.error('Creche grades POST error:', error)
    return NextResponse.json({ error: 'Failed to create creche grade' }, { status: 500 })
  }
}

// DELETE /api/admin/grades/creche - Delete a creche grade
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const gradeId = searchParams.get('id')
    if (!gradeId) {
      return NextResponse.json({ error: 'Grade ID is required' }, { status: 400 })
    }

    await db.grade_creche.delete({
      where: { grade_creche_id: parseInt(gradeId) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Creche grades DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete creche grade' }, { status: 500 })
  }
}
