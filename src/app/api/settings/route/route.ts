import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')

  const where: Record<string, unknown> = {}
  if (type) where.type = type

  const settings = await db.settings.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    orderBy: { settings_id: 'asc' },
  })

  return NextResponse.json(settings)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { type, description, value } = body

  if (!type) return NextResponse.json({ error: 'Type is required' }, { status: 400 })

  // Upsert: check if type exists
  const existing = await db.settings.findFirst({ where: { type } })

  let setting
  if (existing) {
    setting = await db.settings.update({
      where: { settings_id: existing.settings_id },
      data: { description: description || '', value: value || '' },
    })
  } else {
    setting = await db.settings.create({
      data: { type, description: description || '', value: value || '' },
    })
  }

  return NextResponse.json(setting)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { settings_id, type, description, value } = body

  if (!settings_id) return NextResponse.json({ error: 'Settings ID required' }, { status: 400 })

  const setting = await db.settings.update({
    where: { settings_id: parseInt(settings_id) },
    data: { type, description: description || '', value: value || '' },
  })

  return NextResponse.json(setting)
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await db.settings.delete({ where: { settings_id: parseInt(id) } })
  return NextResponse.json({ success: true })
}
