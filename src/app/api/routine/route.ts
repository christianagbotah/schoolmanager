import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/routine
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sectionId = searchParams.get('section_id')

    const where: Record<string, unknown> = {}
    if (sectionId) where.section_id = parseInt(sectionId)

    const routines = await db.class_routine.findMany({
      where,
      include: {
        section: { select: { section_id: true, name: true } },
      },
      orderBy: [{ day: 'asc' }, { time_start: 'asc' }],
    })

    return NextResponse.json({ routines })
  } catch (error) {
    console.error('Routine GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch routines' }, { status: 500 })
  }
}

// POST /api/routine
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { section_id, subject_id, time_start, time_end, day, room } = body

    if (!section_id || !subject_id || !day || !time_start || !time_end) {
      return NextResponse.json({ error: 'section_id, subject_id, day, time_start, and time_end are required' }, { status: 400 })
    }

    const routine = await db.class_routine.create({
      data: {
        section_id: parseInt(section_id),
        subject_id: parseInt(subject_id),
        time_start,
        time_end,
        day,
        room: room || '',
      },
      include: {
        section: { select: { section_id: true, name: true } },
      },
    })

    return NextResponse.json(routine, { status: 201 })
  } catch (error) {
    console.error('Routine POST error:', error)
    return NextResponse.json({ error: 'Failed to create routine' }, { status: 500 })
  }
}

// PUT /api/routine
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { class_routine_id, section_id, subject_id, time_start, time_end, day, room } = body

    if (!class_routine_id) {
      return NextResponse.json({ error: 'class_routine_id is required' }, { status: 400 })
    }

    const routine = await db.class_routine.update({
      where: { class_routine_id: parseInt(class_routine_id) },
      data: {
        section_id: section_id !== undefined ? parseInt(section_id) : undefined,
        subject_id: subject_id !== undefined ? parseInt(subject_id) : undefined,
        time_start: time_start ?? undefined,
        time_end: time_end ?? undefined,
        day: day ?? undefined,
        room: room ?? undefined,
      },
    })

    return NextResponse.json(routine)
  } catch (error) {
    console.error('Routine PUT error:', error)
    return NextResponse.json({ error: 'Failed to update routine' }, { status: 500 })
  }
}
