import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const parentId = parseInt(session.user.id);
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('thread_id');
    const action = searchParams.get('action');

    const parentCode = `parent-${parentId}`;

    if (action === 'recipients') {
      // Get available recipients (teachers linked to children)
      const children = await db.student.findMany({
        where: { parent_id: parentId },
        select: { enrolls: { select: { class: { select: { teacher_id: true } } } } },
      });
      const teacherIds = children
        .flatMap(c => c.enrolls.map(e => e.class?.teacher_id))
        .filter((v): v is number => v !== null && v !== undefined);
      const uniqueTeacherIds = [...new Set(teacherIds)];

      const teachers = await db.teacher.findMany({
        where: { teacher_id: { in: uniqueTeacherIds } },
        select: { teacher_id: true, name: true, email: true, phone: true },
      });

      return NextResponse.json({ recipients: teachers.map(t => ({ id: t.teacher_id, name: t.name, email: t.email, phone: t.phone, type: 'teacher' })) });
    }

    if (threadId) {
      // Get thread messages
      const thread = await db.message_thread.findFirst({
        where: { message_thread_id: parseInt(threadId) },
      });
      if (!thread) {
        return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
      }

      const messages = await db.message.findMany({
        where: { message_thread_id: parseInt(threadId) },
        orderBy: { sent_on: 'asc' },
        select: {
          message_id: true,
          sender_id: true,
          sender_type: true,
          message: true,
          file: true,
          sent_on: true,
        },
      });

      return NextResponse.json({ thread, messages });
    }

    // Get thread list
    const threads = await db.message_thread.findMany({
      where: {
        OR: [
          { sender: parentCode },
          { reciever: parentCode },
        ],
      },
      orderBy: { last_message_timestamp: 'desc' },
      select: {
        message_thread_id: true,
        hash: true,
        subject: true,
        sender: true,
        reciever: true,
        last_message_timestamp: true,
        participant_ids: true,
      },
    });

    return NextResponse.json({ threads });
  } catch (error) {
    console.error('Parent messages error:', error);
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const parentId = parseInt(session.user.id);
    const body = await request.json();
    const { action } = body;

    if (action === 'send_new') {
      const { receiver_type, receiver_id, message } = body;
      if (!receiver_type || !receiver_id || !message) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
      }

      const parentCode = `parent-${parentId}`;
      const receiverCode = `${receiver_type}-${receiver_id}`;

      // Create thread
      const thread = await db.message_thread.create({
        data: {
          hash: `${parentCode}_${receiverCode}_${Date.now()}`,
          subject: '',
          sender: parentCode,
          reciever: receiverCode,
          last_message_timestamp: new Date(),
          participant_ids: `${parentCode},${receiverCode}`,
        },
      });

      // Create message
      await db.message.create({
        data: {
          message_thread_id: thread.message_thread_id,
          sender_id: parentId,
          sender_type: 'parent',
          message,
          sent_on: new Date(),
        },
      });

      return NextResponse.json({ success: true, thread_id: thread.message_thread_id });
    }

    if (action === 'send_reply') {
      const { thread_id, message } = body;
      if (!thread_id || !message) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
      }

      await db.message.create({
        data: {
          message_thread_id: parseInt(thread_id),
          sender_id: parentId,
          sender_type: 'parent',
          message,
          sent_on: new Date(),
        },
      });

      // Update thread timestamp
      await db.message_thread.update({
        where: { message_thread_id: parseInt(thread_id) },
        data: { last_message_timestamp: new Date() },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Parent messages POST error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('thread_id');
    if (!threadId) {
      return NextResponse.json({ error: 'Missing thread_id' }, { status: 400 });
    }

    // Delete messages first, then thread
    await db.message.deleteMany({ where: { message_thread_id: parseInt(threadId) } });
    await db.message_thread.delete({ where: { message_thread_id: parseInt(threadId) } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Parent messages DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete thread' }, { status: 500 });
  }
}
