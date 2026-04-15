import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action') || ''

  if (action === 'students') {
    const assignments = await db.boarding_student.findMany({
      where: { is_active: 1 },
      include: {
        // @ts-expect-error Prisma relation via raw field
        _student: { select: { name: true, student_code: true, sex: true, class_name: String } },
      },
      orderBy: { id: 'desc' },
      take: 200,
    })
    return NextResponse.json(assignments)
  }

  if (action === 'stats') {
    const houses = await db.boarding_house.count()
    const dormitories = await db.dormitory.count()
    const assigned = await db.boarding_student.count({ where: { is_active: 1 } })
    const totalBeds = await db.dormitory.aggregate({ _sum: { number_of_beds: true } })
    const totalRooms = await db.dormitory.aggregate({ _sum: { number_of_rooms: true } })
    const totalCapacity = await db.boarding_house.aggregate({ _sum: { house_capacity: true } })

    return NextResponse.json({
      houses, dormitories, assigned,
      totalBeds: totalBeds._sum.number_of_beds || 0,
      totalRooms: totalRooms._sum.number_of_rooms || 0,
      totalCapacity: totalCapacity._sum.house_capacity || 0,
    })
  }

  // Default: houses + dormitories + assignments
  const houses = await db.boarding_house.findMany({ orderBy: { house_id: 'desc' } })
  const dormitories = await db.dormitory.findMany({ orderBy: { dormitory_id: 'desc' } })
  const assignments = await db.boarding_student.findMany({
    where: { is_active: 1 },
    orderBy: { id: 'desc' },
    take: 200,
  })

  return NextResponse.json({ houses, dormitories, assignments })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action } = body

  // Create house
  if (action === 'create_house') {
    const { house_name, house_description, house_capacity } = body
    if (!house_name) return NextResponse.json({ error: 'House name required' }, { status: 400 })
    const house = await db.boarding_house.create({
      data: { house_name, house_description: house_description || '', house_capacity: parseInt(house_capacity) || 0 },
    })
    return NextResponse.json(house, { status: 201 })
  }

  // Create dormitory
  if (action === 'create_dormitory') {
    const { dormitory_name, dormitory_description, number_of_rooms, number_of_beds } = body
    if (!dormitory_name) return NextResponse.json({ error: 'Dormitory name required' }, { status: 400 })
    const dorm = await db.dormitory.create({
      data: {
        dormitory_name,
        dormitory_description: dormitory_description || '',
        number_of_rooms: parseInt(number_of_rooms) || 0,
        number_of_beds: parseInt(number_of_beds) || 0,
      },
    })
    return NextResponse.json(dorm, { status: 201 })
  }

  // Assign student
  if (action === 'assign_student') {
    const { student_id, house_id, dormitory_id, bed_number, academic_year } = body
    if (!student_id) return NextResponse.json({ error: 'Student ID required' }, { status: 400 })

    // Deactivate existing assignment
    await db.boarding_student.updateMany({
      where: { student_id: parseInt(student_id), is_active: 1 },
      data: { is_active: 0 },
    })

    const assignment = await db.boarding_student.create({
      data: {
        student_id: parseInt(student_id),
        house_id: house_id ? parseInt(house_id) : null,
        dormitory_id: dormitory_id ? parseInt(dormitory_id) : null,
        bed_number: bed_number || '',
        academic_year: academic_year || '',
        assigned_at: new Date(),
        is_active: 1,
      },
    })
    return NextResponse.json(assignment, { status: 201 })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { action } = body

  if (action === 'update_house') {
    const { house_id, house_name, house_description, house_capacity } = body
    const house = await db.boarding_house.update({
      where: { house_id: parseInt(house_id) },
      data: {
        house_name,
        house_description: house_description || '',
        house_capacity: house_capacity ? parseInt(house_capacity) : undefined,
      },
    })
    return NextResponse.json(house)
  }

  if (action === 'update_dormitory') {
    const { dormitory_id, dormitory_name, dormitory_description, number_of_rooms, number_of_beds } = body
    const dorm = await db.dormitory.update({
      where: { dormitory_id: parseInt(dormitory_id) },
      data: {
        dormitory_name,
        dormitory_description: dormitory_description || '',
        number_of_rooms: number_of_rooms ? parseInt(number_of_rooms) : undefined,
        number_of_beds: number_of_beds ? parseInt(number_of_beds) : undefined,
      },
    })
    return NextResponse.json(dorm)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const id = searchParams.get('id')

  if (!action || !id) return NextResponse.json({ error: 'action and id required' }, { status: 400 })

  if (action === 'house') {
    await db.boarding_student.deleteMany({ where: { house_id: parseInt(id) } })
    await db.boarding_house.delete({ where: { house_id: parseInt(id) } })
  } else if (action === 'dormitory') {
    await db.boarding_student.deleteMany({ where: { dormitory_id: parseInt(id) } })
    await db.dormitory.delete({ where: { dormitory_id: parseInt(id) } })
  } else if (action === 'assignment') {
    await db.boarding_student.delete({ where: { id: parseInt(id) } })
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
