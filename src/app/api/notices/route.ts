import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const statusFilter = searchParams.get('status') || ''

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { notice: { contains: search } },
    ]
  }
  if (statusFilter === 'archived') {
    where.status = 0
  } else if (statusFilter === 'running') {
    where.status = 1
  }

  const [notices, total, statusGroups] = await Promise.all([
    db.notice.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { timestamp: 'desc' },
      take: 200,
    }),
    db.notice.count({}),
    db.notice.groupBy({ by: ['status'], _count: { id: true } }),
  ])

  const stats = {
    total,
    running: statusGroups.find((g) => g.status === 1)?._count.id || 0,
    archived: statusGroups.find((g) => g.status === 0)?._count.id || 0,
  }

  // Map to frontend-friendly shape
  const mapped = notices.map((n) => ({
    id: n.id,
    title: n.title,
    notice: n.notice,
    is_pinned: n.show_on_website === 1,
    show_on_website: n.show_on_website === 1,
    visibility_roles: n.visibility_roles || 'all',
    attachment: n.attachment || '',
    image: n.image || '',
    check_sms: n.check_sms,
    sms_target: n.sms_target,
    check_email: n.check_email,
    start_date: n.start_date,
    end_date: n.end_date,
    status: n.status === 1 ? 'running' : 'archived',
    created_at: n.timestamp,
    timestamp: n.timestamp,
    notice_timestamp: n.notice_timestamp,
  }))

  return NextResponse.json({ data: mapped, stats })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, notice, timestamp, show_on_website, visibility_roles, attachment, image, check_sms, sms_target, check_email, start_date, end_date } = body

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const newNotice = await db.notice.create({
    data: {
      title,
      notice: notice || '',
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      show_on_website: show_on_website !== false ? 1 : 0,
      visibility_roles: visibility_roles || 'all',
      attachment: attachment || '',
      image: image || '',
      check_sms: check_sms === 1 ? 1 : 2,
      sms_target: sms_target || 0,
      check_email: check_email === 1 ? 1 : 2,
      start_date: start_date ? new Date(start_date) : null,
      end_date: end_date ? new Date(end_date) : null,
      status: 1,
      create_timestamp: Math.floor(Date.now() / 1000),
    },
  })

  return NextResponse.json(newNotice, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body

  if (!id) {
    return NextResponse.json({ error: 'Notice ID is required' }, { status: 400 })
  }

  const updated = await db.notice.update({
    where: { id: parseInt(id) },
    data: {
      title: data.title,
      notice: data.notice || '',
      timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
      show_on_website: data.show_on_website !== undefined ? (data.show_on_website ? 1 : 0) : undefined,
      visibility_roles: data.visibility_roles || undefined,
      attachment: data.attachment !== undefined ? data.attachment : undefined,
      image: data.image !== undefined ? data.image : undefined,
      check_sms: data.check_sms !== undefined ? data.check_sms : undefined,
      sms_target: data.sms_target !== undefined ? data.sms_target : undefined,
      check_email: data.check_email !== undefined ? data.check_email : undefined,
      start_date: data.start_date ? new Date(data.start_date) : undefined,
      end_date: data.end_date ? new Date(data.end_date) : undefined,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const action = searchParams.get('action')

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  if (action === 'archive') {
    await db.notice.update({ where: { id: parseInt(id) }, data: { status: 0 } })
    return NextResponse.json({ success: true, message: 'Notice archived' })
  }

  if (action === 'restore') {
    await db.notice.update({ where: { id: parseInt(id) }, data: { status: 1 } })
    return NextResponse.json({ success: true, message: 'Notice restored' })
  }

  await db.notice.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ success: true })
}
