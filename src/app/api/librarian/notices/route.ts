import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/librarian/notices - Notices visible to librarian
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notices = await db.notice.findMany({
      where: {
        status: 1,
        OR: [
          { visibility_roles: "all" },
          { visibility_roles: { contains: "librarian" } },
        ],
      },
      orderBy: { create_timestamp: "desc" },
      select: {
        id: true,
        title: true,
        notice: true,
        timestamp: true,
        create_timestamp: true,
        start_date: true,
        end_date: true,
        show_on_website: true,
        attachment: true,
        image: true,
      },
    });

    return NextResponse.json(notices);
  } catch (err) {
    console.error("Librarian notices error:", err);
    return NextResponse.json({ error: "Failed to load notices" }, { status: 500 });
  }
}

// POST /api/librarian/notices - Create a library notice
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, notice: noticeText, start_date, end_date, show_on_website } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const now = new Date();
    const newNotice = await db.notice.create({
      data: {
        title,
        notice: noticeText || "",
        timestamp: now,
        create_timestamp: Math.floor(now.getTime() / 1000),
        start_date: start_date ? new Date(start_date) : now,
        end_date: end_date ? new Date(end_date) : null,
        show_on_website: show_on_website ? 1 : 0,
        visibility_roles: "all",
        status: 1,
      },
    });

    return NextResponse.json({ success: true, message: "Notice created", notice: newNotice }, { status: 201 });
  } catch (err: any) {
    console.error("Create notice error:", err);
    return NextResponse.json({ error: err.message || "Failed to create notice" }, { status: 500 });
  }
}

// DELETE /api/librarian/notices - Delete a notice
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Notice ID is required" }, { status: 400 });
    }

    await db.notice.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true, message: "Notice deleted" });
  } catch (err: any) {
    console.error("Delete notice error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete notice" }, { status: 500 });
  }
}
