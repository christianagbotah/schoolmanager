import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { verifyStudent, studentError } from "@/lib/verify-student";

export async function GET(req: NextRequest) {
  const auth = await verifyStudent();
  if (auth.error) return studentError(auth.error);

  try {
    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get("thread_id");
    const studentId = auth.studentId;

    if (threadId) {
      // Fetch messages for a specific thread
      const messages = await db.message.findMany({
        where: { message_thread_id: parseInt(threadId) },
        orderBy: { sent_on: "asc" },
      });
      return NextResponse.json({ messages });
    }

    // Fetch thread list for this student
    // Student threads have sender or reciever containing "student-{id}"
    const studentKey = `student-${studentId}`;

    const threads = await db.message_thread.findMany({
      where: {
        OR: [
          { sender: { contains: studentKey } },
          { reciever: { contains: studentKey } },
        ],
      },
      orderBy: { last_message_timestamp: "desc" },
    });

    // Get latest message for each thread
    const threadData = await Promise.all(
      threads.map(async (thread) => {
        const lastMessage = await db.message.findFirst({
          where: { message_thread_id: thread.message_thread_id },
          orderBy: { sent_on: "desc" },
        });

        // Determine the partner name
        let partnerKey = thread.sender;
        if (thread.sender === studentKey) partnerKey = thread.reciever;
        const [partnerType, partnerIdStr] = partnerKey.split("-");
        const partnerId = parseInt(partnerIdStr);
        let partnerName = "Unknown";

        try {
          if (partnerType === "teacher") {
            const teacher = await db.teacher.findUnique({ where: { teacher_id: partnerId }, select: { name: true } });
            if (teacher) partnerName = teacher.name;
          } else if (partnerType === "parent") {
            const parent = await db.parent.findUnique({ where: { parent_id: partnerId }, select: { name: true } });
            if (parent) partnerName = parent.name;
          } else if (partnerType === "admin") {
            const admin = await db.admin.findUnique({ where: { admin_id: partnerId }, select: { name: true } });
            if (admin) partnerName = admin.name;
          }
        } catch {
          // ignore
        }

        // Count unread messages
        const unreadCount = await db.message.count({
          where: {
            message_thread_id: thread.message_thread_id,
            sender: { not: studentKey },
          },
        });

        return {
          message_thread_id: thread.message_thread_id,
          subject: thread.subject || "",
          partner_name: partnerName,
          partner_type: partnerType,
          last_message: lastMessage?.message || "",
          last_message_time: lastMessage?.sent_on || null,
          unread_count: unreadCount,
        };
      })
    );

    return NextResponse.json({ threads: threadData });
  } catch (error) {
    console.error("Student messages error:", error);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyStudent();
  if (auth.error) return studentError(auth.error);

  try {
    const body = await req.json();
    const { action } = body;
    const studentId = auth.studentId;
    const studentKey = `student-${studentId}`;

    if (action === "send_new") {
      const { receiver_id, receiver_type, message } = body;
      if (!receiver_id || !message) {
        return NextResponse.json({ error: "Receiver and message are required" }, { status: 400 });
      }

      const receiverKey = `${receiver_type}-${receiver_id}`;

      // Check if thread already exists
      const existingThread = await db.message_thread.findFirst({
        where: {
          OR: [
            { sender: studentKey, reciever: receiverKey },
            { sender: receiverKey, reciever: studentKey },
          ],
        },
      });

      let threadId: number;
      if (existingThread) {
        threadId = existingThread.message_thread_id;
        await db.message_thread.update({
          where: { message_thread_id: threadId },
          data: { last_message_timestamp: new Date() },
        });
      } else {
        const newThread = await db.message_thread.create({
          data: {
            hash: `${studentKey}-${receiverKey}`,
            sender: studentKey,
            reciever: receiverKey,
            last_message_timestamp: new Date(),
          },
        });
        threadId = newThread.message_thread_id;
      }

      await db.message.create({
        data: {
          message_thread_id: threadId,
          sender_id: studentId,
          sender_type: "student",
          message,
        },
      });

      return NextResponse.json({ success: true, thread_id: threadId });
    }

    if (action === "send_reply") {
      const { thread_id, message } = body;
      if (!thread_id || !message) {
        return NextResponse.json({ error: "Thread ID and message are required" }, { status: 400 });
      }

      await db.message.create({
        data: {
          message_thread_id: parseInt(thread_id),
          sender_id: studentId,
          sender_type: "student",
          message,
        },
      });

      await db.message_thread.update({
        where: { message_thread_id: parseInt(thread_id) },
        data: { last_message_timestamp: new Date() },
      });

      return NextResponse.json({ success: true });
    }

    if (action === "delete") {
      const { thread_id } = body;
      if (!thread_id) {
        return NextResponse.json({ error: "Thread ID is required" }, { status: 400 });
      }

      await db.message.deleteMany({ where: { message_thread_id: parseInt(thread_id) } });
      await db.message_thread.delete({ where: { message_thread_id: parseInt(thread_id) } });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Student messages POST error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
