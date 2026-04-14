import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const houses = await db.boarding_house.findMany({
    orderBy: { house_id: 'desc' },
  })

  const dormitories = await db.dormitory.findMany({
    orderBy: { dormitory_id: 'desc' },
  })

  return NextResponse.json({ houses, dormitories })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { type, ...data } = body

  if (type === 'house') {
    const { house_name, house_description, house_capacity } = data
    if (!house_name) return NextResponse.json({ error: 'House name is required' }, { status: 400 })
    const house = await db.boarding_house.create({
      data: {
        house_name,
        house_description: house_description || '',
        house_capacity: house_capacity ? parseInt(house_capacity) : 0,
      },
    })
    return NextResponse.json(house, { status: 201 })
  }

  if (type === 'dormitory') {
    const { dormitory_name, dormitory_description, number_of_rooms, number_of_beds } = data
    if (!dormitory_name) return NextResponse.json({ error: 'Dormitory name is required' }, { status: 400 })
    const dorm = await db.dormitory.create({
      data: {
        dormitory_name,
        dormitory_description: dormitory_description || '',
        number_of_rooms: number_of_rooms ? parseInt(number_of_rooms) : 0,
        number_of_beds: number_of_beds ? parseInt(number_of_beds) : 0,
      },
    })
    return NextResponse.json(dorm, { status: 201 })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}

export async function PUT(req: Request) {
  const body = await req.json()
  const { type, ...data } = body

  if (type === 'house') {
    const house = await db.boarding_house.update({
      where: { house_id: parseInt(data.house_id) },
      data: {
        house_name: data.house_name,
        house_description: data.house_description || '',
        house_capacity: data.house_capacity ? parseInt(data.house_capacity) : undefined,
      },
    })
    return NextResponse.json(house)
  }

  if (type === 'dormitory') {
    const dorm = await db.dormitory.update({
      where: { dormitory_id: parseInt(data.dormitory_id) },
      data: {
        dormitory_name: data.dormitory_name,
        dormitory_description: data.dormitory_description || '',
        number_of_rooms: data.number_of_rooms ? parseInt(data.number_of_rooms) : undefined,
        number_of_beds: data.number_of_beds ? parseInt(data.number_of_beds) : undefined,
      },
    })
    return NextResponse.json(dorm)
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const id = searchParams.get('id')

  if (!type || !id) return NextResponse.json({ error: 'type and id required' }, { status: 400 })

  if (type === 'house') {
    await db.boarding_house.delete({ where: { house_id: parseInt(id) } })
  } else if (type === 'dormitory') {
    await db.dormitory.delete({ where: { dormitory_id: parseInt(id) } })
  }

  return NextResponse.json({ success: true })
}
