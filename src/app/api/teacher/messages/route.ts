import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/teacher-auth";

// GET /api/teacher/messages — teacher's message threads
export async function GET(request: NextRequest) {
  const { error, teacherId } = await requireTeacher();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get("thread_id");

    const teacherPrefix = `teacher-${teacherId}`;

    if (threadId) {
      // Get messages for a specific thread
      const thread = await db.messageThread.findFirst({
        where: {
          message_thread_id: parseInt(threadId),
          OR: [
            { sender: teacherPrefix },
            { reciever: teacherPrefix },
          ],
        },
      });

      if (!thread) {
        return NextResponse.json({ thread: null, messages: [] });
      }

      const messages = await db.message.findMany({
        where: { message_thread_id: parseInt(threadId) },
        orderBy: { sent_on: "asc" },
      });

      return NextResponse.json({ thread, messages });
    }

    // Get all threads for this teacher
    const threads = await db.messageThread.findMany({
      where: {
        OR: [
          { sender: teacherPrefix },
          { reciever: teacherPrefix },
        ],
      },
      orderBy: { last_message_timestamp: "desc" },
      take: 50,
    });

    return NextResponse.json({ threads });
  } catch (err) {
    console.error("Teacher messages error:", err);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

// POST /api/teacher/messages — send message
export async function POST(request: NextRequest) {
  const { error, teacherId } = await requireTeacher();
  if (error) return error;

  try {
    const body = await request.json();
    const { thread_id, receiver_id, message, file } = body;

    if (!receiver_id || !message) {
      return NextResponse.json({ error: "Receiver and message required" }, { status: 400 });
    }

    const teacherPrefix = `teacher-${teacherId}`;

    if (thread_id) {
      // Reply to existing thread
      const thread = await db.messageThread.findFirst({
        where: {
          message_thread_id: parseInt(thread_id),
          OR: [
            { sender: teacherPrefix },
            { reciever: teacherPrefix },
          ],
        },
      });

      if (!thread) {
        return NextResponse.json({ error: "Thread not found" }, { status: 404 });
      }

      const msg = await db.message.create({
        data: {
          message_thread_id: parseInt(thread_id),
          sender_id: teacherId,
          sender_type: "teacher",
          message,
          file: file || "",
        },
      });

      // Update last message timestamp
      await db.messageThread.update({
        where: { message_thread_id: parseInt(thread_id) },
        data: { last_message_timestamp: new Date() },
      });

      return NextResponse.json(msg, { status: 201 });
    }

    // Create new thread
    const hash = `thread-${Date.now()}-${teacherId}`;

    // Determine receiver prefix
    let receiverPrefix = "admin-";
    if (receiver_id.startsWith("teacher-")) {
      receiverPrefix = "teacher-";
    } else if (receiver_id.startsWith("parent-")) {
      receiverPrefix = "parent-";
    } else if (receiver_id.startsWith("student-")) {
      receiverPrefix = "student-";
    }

    const thread = await db.messageThread.create({
      data: {
        hash,
        sender: teacherPrefix,
        reciever: receiverPrefix + receiver_id.replace(/^\D+/g, ""),
        last_message_timestamp: new Date(),
      },
    });

    const msg = await db.message.create({
      data: {
        message_thread_id: thread.message_thread_id,
        sender_id: teacherId,
        sender_type: "teacher",
        message,
        file: file || "",
      },
    });

    return NextResponse.json({ thread, message: msg }, { status: 201 });
  } catch (err) {
    console.error("Send teacher message error:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
