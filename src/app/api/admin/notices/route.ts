import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/notices - List notices with status filter, date range, search
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') // 1=running, 0=archived, all
  const dateFrom = searchParams.get('date_from') || ''
  const dateTo = searchParams.get('date_to') || ''

  const where: Record<string, unknown> = {}

  if (status && status !== 'all') {
    where.status = parseInt(status)
  }

  if (dateFrom || dateTo) {
    where.timestamp = {} as Record<string, Date>
    if (dateFrom) (where.timestamp as Record<string, Date>).gte = new Date(dateFrom)
    if (dateTo) (where.timestamp as Record<string, Date>).lte = new Date(dateTo + 'T23:59:59')
    if (Object.keys(where.timestamp as Record<string, Date>).length === 0) {
      delete where.timestamp
    }
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { notice: { contains: search } },
    ]
  }

  const notices = await db.notice.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    orderBy: [{ status: 'desc' }, { id: 'desc' }],
    take: 200,
  })

  // Count stats
  const total = await db.notice.count()
  const running = await db.notice.count({ where: { status: 1 } })
  const archived = await db.notice.count({ where: { status: 0 } })
  const withSms = await db.notice.count({ where: { check_sms: 1 } })

  return NextResponse.json({ notices, stats: { total, running, archived, withSms } })
}

// POST /api/admin/notices - Create notice (mirrors CI3 noticeboard/create)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    title, notice, create_timestamp, image, attachment,
    show_on_website, visibility_roles,
    start_date, end_date,
    check_sms, sms_target, check_email,
  } = body

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const eventDate = create_timestamp ? new Date(create_timestamp) : new Date()
  const noticeTs = Math.floor(eventDate.getTime() / 1000)

  const newNotice = await db.notice.create({
    data: {
      title,
      notice: notice || '',
      create_timestamp: noticeTs,
      timestamp: eventDate,
      notice_timestamp: new Date(),
      start_date: start_date ? new Date(start_date) : null,
      end_date: end_date ? new Date(end_date) : null,
      image: image || '',
      attachment: attachment || '',
      show_on_website: show_on_website !== undefined ? (show_on_website ? 1 : 0) : 1,
      visibility_roles: visibility_roles || 'all',
      check_sms: check_sms || 2,
      sms_target: sms_target || 0,
      check_email: check_email || 2,
      status: 1,
    },
  })

  return NextResponse.json(newNotice, { status: 201 })
}

// PUT /api/admin/notices - Update notice (mirrors CI3 noticeboard/do_update)
export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body

  if (!id) {
    return NextResponse.json({ error: 'Notice ID is required' }, { status: 400 })
  }

  const existing = await db.notice.findUnique({ where: { id: parseInt(id) } })
  if (!existing) {
    return NextResponse.json({ error: 'Notice not found' }, { status: 404 })
  }

  const updateData: Record<string, unknown> = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.notice !== undefined) updateData.notice = data.notice
  if (data.create_timestamp !== undefined) {
    const d = new Date(data.create_timestamp)
    updateData.create_timestamp = Math.floor(d.getTime() / 1000)
    updateData.timestamp = d
  }
  if (data.start_date !== undefined) updateData.start_date = data.start_date ? new Date(data.start_date) : null
  if (data.end_date !== undefined) updateData.end_date = data.end_date ? new Date(data.end_date) : null
  if (data.image !== undefined) updateData.image = data.image
  if (data.attachment !== undefined) updateData.attachment = data.attachment
  if (data.show_on_website !== undefined) updateData.show_on_website = data.show_on_website ? 1 : 0
  if (data.visibility_roles !== undefined) updateData.visibility_roles = data.visibility_roles
  if (data.check_sms !== undefined) updateData.check_sms = data.check_sms
  if (data.sms_target !== undefined) updateData.sms_target = data.sms_target
  if (data.check_email !== undefined) updateData.check_email = data.check_email
  updateData.notice_timestamp = new Date()

  const updated = await db.notice.update({
    where: { id: parseInt(id) },
    data: updateData,
  })

  return NextResponse.json(updated)
}

// DELETE /api/admin/notices - Delete/archive/restore notice
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const action = searchParams.get('action') // archive or restore

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const noticeId = parseInt(id)

  if (action === 'archive') {
    await db.notice.update({
      where: { id: noticeId },
      data: { status: 0 },
    })
    return NextResponse.json({ success: true, message: 'Notice archived' })
  }

  if (action === 'restore') {
    await db.notice.update({
      where: { id: noticeId },
      data: { status: 1 },
    })
    return NextResponse.json({ success: true, message: 'Notice restored' })
  }

  // Hard delete
  await db.notice.delete({ where: { id: noticeId } })
  return NextResponse.json({ success: true })
}
