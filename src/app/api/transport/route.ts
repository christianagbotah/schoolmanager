import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  
  const routes = await db.transport.findMany({
    where: search ? {
      OR: [
        { route_name: { contains: search } },
        { vehicle_number: { contains: search } },
      ]
    } : undefined,
    include: {
      bus_attendances: {
        distinct: ['student_id'],
        select: { student_id: true },
      },
    },
    orderBy: { transport_id: 'desc' },
  })

  const routesWithCount = routes.map(r => ({
    ...r,
    studentCount: r.bus_attendances.length,
    bus_attendances: undefined,
  }))

  return NextResponse.json(routesWithCount)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { route_name, description, vehicle_number, driver_id, fare, facilities } = body

  if (!route_name) {
    return NextResponse.json({ error: 'Route name is required' }, { status: 400 })
  }

  const route = await db.transport.create({
    data: {
      route_name,
      description: description || '',
      vehicle_number: vehicle_number || '',
      driver_id: driver_id ? parseInt(driver_id) : null,
      fare: fare ? parseFloat(fare) : 0,
      facilities: facilities || '',
    },
  })

  return NextResponse.json(route, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { transport_id, ...data } = body

  if (!transport_id) {
    return NextResponse.json({ error: 'Transport ID is required' }, { status: 400 })
  }

  const route = await db.transport.update({
    where: { transport_id },
    data: {
      route_name: data.route_name,
      description: data.description || '',
      vehicle_number: data.vehicle_number || '',
      driver_id: data.driver_id ? parseInt(data.driver_id) : null,
      fare: data.fare ? parseFloat(data.fare) : 0,
      facilities: data.facilities || '',
    },
  })

  return NextResponse.json(route)
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 })
  }

  await db.bus_attendance.deleteMany({ where: { route_id: parseInt(id) } })
  await db.transport.delete({ where: { transport_id: parseInt(id) } })

  return NextResponse.json({ success: true })
}
