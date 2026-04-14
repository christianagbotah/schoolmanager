import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const dormitories = await db.dormitory.findMany({
    orderBy: { dormitory_id: 'desc' },
  })
  return NextResponse.json(dormitories)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { dormitory_name, dormitory_description, number_of_rooms, number_of_beds } = body

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

export async function PUT(req: Request) {
  const body = await req.json()
  const { dormitory_id, ...data } = body

  if (!dormitory_id) return NextResponse.json({ error: 'Dormitory ID required' }, { status: 400 })

  const dorm = await db.dormitory.update({
    where: { dormitory_id: parseInt(dormitory_id) },
    data: {
      dormitory_name: data.dormitory_name,
      dormitory_description: data.dormitory_description || '',
      number_of_rooms: data.number_of_rooms ? parseInt(data.number_of_rooms) : undefined,
      number_of_beds: data.number_of_beds ? parseInt(data.number_of_beds) : undefined,
    },
  })

  return NextResponse.json(dorm)
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await db.dormitory.delete({ where: { dormitory_id: parseInt(id) } })
  return NextResponse.json({ success: true })
}
