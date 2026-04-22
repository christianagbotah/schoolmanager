import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/messages/threads - List all message threads with summary
export async function GET() {
  try {
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
    });

    return NextResponse.json(threads);
  } catch (error) {
    console.error('Error fetching threads:', error);
    return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 });
  }
}

// POST /api/admin/messages/threads - Create a new message thread
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { receiver, message, file } = body;

    if (!receiver || !message) {
      return NextResponse.json({ error: 'Receiver and message are required' }, { status: 400 });
    }

    // Check if thread already exists
    const existingThread = await db.message_thread.findFirst({
      where: {
        OR: [
          { sender: 'admin-1', reciever: receiver },
          { sender: receiver, reciever: 'admin-1' },
        ],
      },
    });

    let threadId: number;

    if (existingThread) {
      threadId = existingThread.message_thread_id;
    } else {
      const hash = Math.random().toString(36).substring(2, 15);
      const thread = await db.message_thread.create({
        data: {
          hash,
          subject: receiver,
          sender: 'admin-1',
          reciever: receiver,
          last_message_timestamp: new Date(),
        },
      });
      threadId = thread.message_thread_id;
    }

    // Create the first message
    const newMessage = await db.message.create({
      data: {
        message_thread_id: threadId,
        sender_id: 1,
        sender_type: 'admin',
        message,
        file: file || '',
        sent_on: new Date(),
      },
    });

    // Update thread timestamp
    await db.message_thread.update({
      where: { message_thread_id: threadId },
      data: { last_message_timestamp: new Date() },
    });

    return NextResponse.json({ thread_id: threadId, message: newMessage }, { status: 201 });
  } catch (error) {
    console.error('Error creating thread:', error);
    return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 });
  }
}

// DELETE /api/admin/messages/threads - Delete a thread by thread_id (query param)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const thread_id = searchParams.get('thread_id');

    if (!thread_id) {
      return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 });
    }

    const tid = parseInt(thread_id);

    await db.message.deleteMany({ where: { message_thread_id: tid } });
    await db.message_thread.delete({ where: { message_thread_id: tid } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting thread:', error);
    return NextResponse.json({ error: 'Failed to delete thread' }, { status: 500 });
  }
}
