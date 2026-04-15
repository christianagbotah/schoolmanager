import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/messages - List threads, thread messages, recipients, or group threads
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const thread_id = searchParams.get('thread_id')
  const action = searchParams.get('action') // recipients | group_threads | group_messages

  if (action === 'recipients') {
    const running_year = await db.settings.findFirst({ where: { type: 'running_year' } })
    const running_term = await db.settings.findFirst({ where: { type: 'running_term' } })
    const year = running_year?.description || ''
    const term = running_term?.description || '1'

    // Active students
    const enrolls = await db.enroll.findMany({
      where: { year, term: term || '1', mute: 0 },
      include: { student: { select: { student_id: true, name: true } } },
    })

    const students = enrolls
      .filter(e => e.student)
      .map(e => ({
        value: `student-${e.student_id}`,
        label: e.student.name,
        type: 'Student',
      }))

    // Active teachers
    const teachers = await db.teacher.findMany({
      where: { block_limit: 0 },
      select: { teacher_id: true, name: true },
    })
    const teacherList = teachers.map(t => ({
      value: `teacher-${t.teacher_id}`,
      label: t.name,
      type: 'Teacher',
    }))

    // Active parents (parents of enrolled students)
    const studentIds = enrolls.map(e => e.student_id)
    const parents: { value: string; label: string; type: string }[] = []
    if (studentIds.length > 0) {
      const studentsWithParent = await db.student.findMany({
        where: { student_id: { in: studentIds }, parent_id: { not: null } },
        include: { parent: { select: { parent_id: true, name: true } } },
        distinct: ['parent_id'],
      })
      for (const s of studentsWithParent) {
        if (s.parent && !parents.find(p => p.value === `parent-${s.parent!.parent_id}`)) {
          parents.push({
            value: `parent-${s.parent.parent_id}`,
            label: s.parent.name,
            type: 'Parent',
          })
        }
      }
    }

    return NextResponse.json([...students, ...teacherList, ...parents])
  }

  // Group messaging endpoints
  if (action === 'group_threads') {
    const groupThreads = await db.group_message_thread.findMany({
      where: { group_message_id: null as unknown as number },
      orderBy: { group_message_id: 'desc' },
      take: 200,
    })
    // Actually use the broadcast-style group_message as group threads
    const groupMessages = await db.group_message.findMany({
      orderBy: { created_at: 'desc' },
      take: 100,
      include: {
        group_message_threads: {
          take: 1,
          orderBy: { sent_at: 'desc' },
        },
      },
    })
    return NextResponse.json(groupMessages)
  }

  if (action === 'group_detail' && thread_id) {
    const groupMsg = await db.group_message.findUnique({
      where: { group_message_id: parseInt(thread_id) },
      include: {
        group_message_threads: {
          orderBy: { sent_at: 'desc' },
        },
      },
    })
    return NextResponse.json(groupMsg)
  }

  if (thread_id && !action) {
    // Get messages for a thread
    const messages = await db.message.findMany({
      where: { message_thread_id: parseInt(thread_id) },
      orderBy: { sent_on: 'asc' },
      take: 500,
    })
    return NextResponse.json(messages)
  }

  // Get all threads for current admin (sender=1)
  const threads = await db.message_thread.findMany({
    where: {
      OR: [
        { sender: { startsWith: 'admin' } },
        { reciever: { startsWith: 'admin' } },
      ],
    },
    include: {
      messages: {
        orderBy: { sent_on: 'desc' },
        take: 1,
        select: { message: true, sent_on: true },
      },
    },
    orderBy: { last_message_timestamp: 'desc' },
    take: 200,
  })

  return NextResponse.json(threads)
}

// POST /api/admin/messages - Send message, create thread, or create group message
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action } = body

  if (action === 'send_new') {
    const { receiver, message, file } = body

    if (!receiver || !message) {
      return NextResponse.json({ error: 'Receiver and message required' }, { status: 400 })
    }

    // Check if thread already exists between admin and this receiver
    const existingThread = await db.message_thread.findFirst({
      where: {
        OR: [
          { sender: 'admin-1', reciever: receiver },
          { sender: receiver, reciever: 'admin-1' },
        ],
      },
    })

    let threadId: number

    if (existingThread) {
      threadId = existingThread.message_thread_id
    } else {
      const hash = Math.random().toString(36).substring(2, 15)
      const thread = await db.message_thread.create({
        data: {
          hash,
          subject: receiver,
          sender: 'admin-1',
          reciever: receiver,
          last_message_timestamp: new Date(),
        },
      })
      threadId = thread.message_thread_id
    }

    const newMessage = await db.message.create({
      data: {
        message_thread_id: threadId,
        sender_id: 1,
        sender_type: 'admin',
        message,
        file: file || '',
        sent_on: new Date(),
      },
    })

    await db.message_thread.update({
      where: { message_thread_id: threadId },
      data: { last_message_timestamp: new Date() },
    })

    return NextResponse.json(newMessage, { status: 201 })
  }

  if (action === 'send_reply') {
    const { thread_id, message, file } = body

    if (!thread_id || !message) {
      return NextResponse.json({ error: 'Thread ID and message required' }, { status: 400 })
    }

    const newMessage = await db.message.create({
      data: {
        message_thread_id: parseInt(thread_id),
        sender_id: 1,
        sender_type: 'admin',
        message,
        file: file || '',
        sent_on: new Date(),
      },
    })

    await db.message_thread.update({
      where: { message_thread_id: parseInt(thread_id) },
      data: { last_message_timestamp: new Date() },
    })

    return NextResponse.json(newMessage, { status: 201 })
  }

  // Group message actions
  if (action === 'create_group') {
    const { title, message, target_group, recipient_ids, file } = body

    if (!title || !message || !target_group) {
      return NextResponse.json({ error: 'Title, message, and target group are required' }, { status: 400 })
    }

    // Create the group broadcast message
    const groupMsg = await db.group_message.create({
      data: {
        title,
        message,
        target_group,
        recipient_ids: recipient_ids || '',
        sender_id: 1,
        sender_type: 'admin',
        file: file || '',
        send_date: new Date(),
        status: 'sent',
        created_at: new Date(),
      },
    })

    return NextResponse.json(groupMsg, { status: 201 })
  }

  if (action === 'send_group_reply') {
    const { group_message_id, message, file } = body

    if (!group_message_id || !message) {
      return NextResponse.json({ error: 'Group message ID and message required' }, { status: 400 })
    }

    // Add a thread entry (recipient=self, admin reply)
    const threadEntry = await db.group_message_thread.create({
      data: {
        group_message_id: parseInt(group_message_id),
        recipient_id: 1,
        recipient_type: 'admin',
        status: 'read',
        sent_at: new Date(),
        read_at: new Date(),
      },
    })

    return NextResponse.json(threadEntry, { status: 201 })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

// DELETE /api/admin/messages - Delete thread or group message
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const thread_id = searchParams.get('thread_id')
  const action = searchParams.get('action')
  const group_id = searchParams.get('group_id')

  if (action === 'group' && group_id) {
    // Delete group message and its threads
    await db.group_message_thread.deleteMany({ where: { group_message_id: parseInt(group_id) } })
    await db.group_message_other.deleteMany({ where: { group_message_id: parseInt(group_id) } })
    await db.group_message.delete({ where: { group_message_id: parseInt(group_id) } })
    return NextResponse.json({ success: true })
  }

  if (!thread_id) {
    return NextResponse.json({ error: 'Thread ID required' }, { status: 400 })
  }

  const tid = parseInt(thread_id)

  // Delete messages first, then thread (mirrors CI3 cascade delete)
  await db.message.deleteMany({ where: { message_thread_id: tid } })
  await db.message_thread.delete({ where: { message_thread_id: tid } })

  return NextResponse.json({ success: true })
}
