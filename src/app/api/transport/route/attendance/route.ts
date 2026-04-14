import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/transport/attendance?route_id=1&date=2025-01-01&direction=morning
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const route_id = searchParams.get('route_id')
  const date = searchParams.get('date')
  const direction = searchParams.get('direction')

  const where: Record<string, unknown> = {}
  if (route_id) where.route_id = parseInt(route_id)
  if (date) where.attendance_date = new Date(date)
  if (direction) where.transport_direction = direction

  const attendance = await db.bus_attendance.findMany({
    where: where as any,
    include: {
      student: {
        select: { student_id: true, name: true, student_code: true },
      },
      transport: {
        select: { transport_id: true, route_name: true, fare: true },
      },
    },
    orderBy: { id: 'desc' },
    take: 200,
  })

  return NextResponse.json(attendance)
}

// POST - Mark attendance
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { student_id, route_id, attendance_date, transport_direction, boarded_in, boarded_out, total_fare } = body

  if (!student_id || !attendance_date) {
    return NextResponse.json({ error: 'student_id and attendance_date are required' }, { status: 400 })
  }

  const data: Record<string, unknown> = {
    student_id: parseInt(student_id),
    attendance_date: new Date(attendance_date),
    transport_direction: transport_direction || 'morning',
    boarded_in: boarded_in ? new Date(boarded_in) : new Date(),
    boarded_out: boarded_out ? new Date(boarded_out) : null,
    total_fare: total_fare ? parseFloat(total_fare) : 0,
  }

  if (route_id) {
    data.route_id = parseInt(route_id)
  }

  // Upsert: check if exists
  const existing = await db.bus_attendance.findFirst({
    where: {
      student_id: parseInt(student_id),
      attendance_date: new Date(attendance_date),
      transport_direction: transport_direction || 'morning',
    },
  })

  let attendance
  if (existing) {
    attendance = await db.bus_attendance.update({
      where: { id: existing.id },
      data,
    })
  } else {
    attendance = await db.bus_attendance.create({ data })
  }

  return NextResponse.json(attendance, { status: 201 })
}

// PUT - Update attendance (e.g., mark boarded out)
export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, boarded_out, total_fare } = body

  if (!id) {
    return NextResponse.json({ error: 'Attendance ID is required' }, { status: 400 })
  }

  const attendance = await db.bus_attendance.update({
    where: { id: parseInt(id) },
    data: {
      ...(boarded_out && { boarded_out: new Date() }),
      ...(total_fare !== undefined && { total_fare: parseFloat(total_fare) }),
    },
  })

  return NextResponse.json(attendance)
}
