import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action') || ''

  if (action === 'students') {
    const assignments = await db.boarding_student.findMany({
      where: { is_active: 1 },
      orderBy: { id: 'desc' },
      take: 200,
    })
    return NextResponse.json(assignments)
  }

  if (action === 'stats') {
    const [houses, dormitories, assigned, teachers] = await Promise.all([
      db.boarding_house.findMany({
        orderBy: { house_id: 'desc' },
        include: { house_master: { select: { teacher_id: true, name: true } } },
      }),
      db.dormitory.findMany({ orderBy: { dormitory_id: 'desc' } }),
      db.boarding_student.count({ where: { is_active: 1 } }),
      db.teacher.findMany({ where: { active_status: 1 }, select: { teacher_id: true, name: true } }),
    ])
    const totalBeds = dormitories.reduce((s, d) => s + d.number_of_beds, 0)
    const totalRooms = dormitories.reduce((s, d) => s + d.number_of_rooms, 0)
    const totalCapacity = houses.reduce((s, h) => s + h.house_capacity, 0)

    return NextResponse.json({
      houses,
      dormitories,
      assigned,
      totalBeds,
      totalRooms,
      totalCapacity,
      teachers,
    })
  }

  // Default: houses + dormitories + assignments
  const houses = await db.boarding_house.findMany({
    orderBy: { house_id: 'desc' },
    include: { house_master: { select: { teacher_id: true, name: true } } },
  })
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
    const {
      house_name, house_description, house_capacity,
      house_master_id, house_year_established, house_gps_code, house_image_link,
    } = body
    if (!house_name) return NextResponse.json({ error: 'House name required' }, { status: 400 })
    const house = await db.boarding_house.create({
      data: {
        house_name,
        house_description: house_description || '',
        house_capacity: parseInt(house_capacity) || 0,
        house_master_id: house_master_id ? parseInt(house_master_id) : null,
        house_year_established: house_year_established || '',
        house_gps_code: house_gps_code || '',
        house_image_link: house_image_link || '',
      },
    })
    return NextResponse.json(house, { status: 201 })
  }

  // Create dormitory
  if (action === 'create_dormitory') {
    const {
      dormitory_name, dormitory_description, number_of_rooms, number_of_beds,
      house_id, dormitory_type, dormitory_floor, dormitory_capacity,
      dormitory_prefect_id, bed_code_prefix,
    } = body
    if (!dormitory_name) return NextResponse.json({ error: 'Dormitory name required' }, { status: 400 })
    const dorm = await db.dormitory.create({
      data: {
        dormitory_name,
        dormitory_description: dormitory_description || '',
        number_of_rooms: parseInt(number_of_rooms) || 0,
        number_of_beds: parseInt(number_of_beds) || 0,
        house_id: house_id ? parseInt(house_id) : null,
        dormitory_type: dormitory_type || '',
        dormitory_floor: dormitory_floor || '',
        dormitory_capacity: parseInt(dormitory_capacity) || 0,
        dormitory_prefect_id: dormitory_prefect_id ? parseInt(dormitory_prefect_id) : null,
        bed_code_prefix: bed_code_prefix || '',
      },
    })
    return NextResponse.json(dorm, { status: 201 })
  }

  // Update house (frontend sends POST)
  if (action === 'update_house') {
    const {
      house_id, house_name, house_description, house_capacity,
      house_master_id, house_year_established, house_gps_code, house_image_link,
    } = body
    if (!house_id) return NextResponse.json({ error: 'House ID required' }, { status: 400 })
    const house = await db.boarding_house.update({
      where: { house_id: parseInt(house_id) },
      data: {
        house_name,
        house_description: house_description || '',
        house_capacity: house_capacity ? parseInt(house_capacity) : undefined,
        house_master_id: house_master_id !== undefined ? (house_master_id ? parseInt(house_master_id) : null) : undefined,
        house_year_established: house_year_established ?? undefined,
        house_gps_code: house_gps_code ?? undefined,
        house_image_link: house_image_link ?? undefined,
      },
    })
    return NextResponse.json(house)
  }

  // Update dormitory (frontend sends POST)
  if (action === 'update_dormitory') {
    const {
      dormitory_id, dormitory_name, dormitory_description, number_of_rooms, number_of_beds,
      house_id, dormitory_type, dormitory_floor, dormitory_capacity,
      dormitory_prefect_id, bed_code_prefix,
    } = body
    if (!dormitory_id) return NextResponse.json({ error: 'Dormitory ID required' }, { status: 400 })
    const dorm = await db.dormitory.update({
      where: { dormitory_id: parseInt(dormitory_id) },
      data: {
        dormitory_name,
        dormitory_description: dormitory_description || '',
        number_of_rooms: number_of_rooms ? parseInt(number_of_rooms) : undefined,
        number_of_beds: number_of_beds ? parseInt(number_of_beds) : undefined,
        house_id: house_id !== undefined ? (house_id ? parseInt(house_id) : null) : undefined,
        dormitory_type: dormitory_type ?? undefined,
        dormitory_floor: dormitory_floor ?? undefined,
        dormitory_capacity: dormitory_capacity !== undefined ? parseInt(dormitory_capacity) : undefined,
        dormitory_prefect_id: dormitory_prefect_id !== undefined ? (dormitory_prefect_id ? parseInt(dormitory_prefect_id) : null) : undefined,
        bed_code_prefix: bed_code_prefix ?? undefined,
      },
    })
    return NextResponse.json(dorm)
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
    const {
      house_id, house_name, house_description, house_capacity,
      house_master_id, house_year_established, house_gps_code, house_image_link,
    } = body
    const house = await db.boarding_house.update({
      where: { house_id: parseInt(house_id) },
      data: {
        house_name,
        house_description: house_description || '',
        house_capacity: house_capacity ? parseInt(house_capacity) : undefined,
        house_master_id: house_master_id !== undefined ? (house_master_id ? parseInt(house_master_id) : null) : undefined,
        house_year_established: house_year_established ?? undefined,
        house_gps_code: house_gps_code ?? undefined,
        house_image_link: house_image_link ?? undefined,
      },
    })
    return NextResponse.json(house)
  }

  if (action === 'update_dormitory') {
    const {
      dormitory_id, dormitory_name, dormitory_description, number_of_rooms, number_of_beds,
      house_id, dormitory_type, dormitory_floor, dormitory_capacity,
      dormitory_prefect_id, bed_code_prefix,
    } = body
    const dorm = await db.dormitory.update({
      where: { dormitory_id: parseInt(dormitory_id) },
      data: {
        dormitory_name,
        dormitory_description: dormitory_description || '',
        number_of_rooms: number_of_rooms ? parseInt(number_of_rooms) : undefined,
        number_of_beds: number_of_beds ? parseInt(number_of_beds) : undefined,
        house_id: house_id !== undefined ? (house_id ? parseInt(house_id) : null) : undefined,
        dormitory_type: dormitory_type ?? undefined,
        dormitory_floor: dormitory_floor ?? undefined,
        dormitory_capacity: dormitory_capacity !== undefined ? parseInt(dormitory_capacity) : undefined,
        dormitory_prefect_id: dormitory_prefect_id !== undefined ? (dormitory_prefect_id ? parseInt(dormitory_prefect_id) : null) : undefined,
        bed_code_prefix: bed_code_prefix ?? undefined,
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
