import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const thread_id = searchParams.get('thread_id')
  const search = searchParams.get('search')

  if (thread_id) {
    const messages = await db.message.findMany({
      where: { message_thread_id: parseInt(thread_id) },
      orderBy: { sent_on: 'asc' },
      take: 200,
    })
    return NextResponse.json(messages)
  }

  // Get all threads
  let threads = await db.message_thread.findMany({
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

  if (search) {
    threads = threads.filter(t =>
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.messages[0]?.message.toLowerCase().includes(search.toLowerCase())
    )
  }

  return NextResponse.json(threads)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { thread_id, sender_id, message, file } = body

  if (!thread_id || !sender_id || !message) {
    return NextResponse.json({ error: 'thread_id, sender_id, and message are required' }, { status: 400 })
  }

  const newMessage = await db.message.create({
    data: {
      message_thread_id: parseInt(thread_id),
      sender_id: parseInt(sender_id),
      message,
      file: file || '',
      sent_on: new Date(),
    },
  })

  // Update thread timestamp
  await db.message_thread.update({
    where: { message_thread_id: parseInt(thread_id) },
    data: { last_message_timestamp: new Date() },
  })

  return NextResponse.json(newMessage, { status: 201 })
}

// Create new thread
export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { subject, participant_ids } = body

  if (!subject) {
    return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
  }

  const hash = Math.random().toString(36).substring(7)
  const thread = await db.message_thread.create({
    data: {
      hash,
      subject,
      participant_ids: participant_ids || '',
      last_message_timestamp: new Date(),
    },
  })

  return NextResponse.json(thread)
}
