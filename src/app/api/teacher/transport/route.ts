import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireTeacher } from "@/lib/teacher-auth";

// GET /api/teacher/transport — transport info
export async function GET() {
  const { error } = await requireTeacher();
  if (error) return error;

  try {
    const routes = await db.transport.findMany({
      orderBy: { transport_id: "desc" },
    });

    return NextResponse.json(routes);
  } catch (err) {
    console.error("Teacher transport error:", err);
    return NextResponse.json({ error: "Failed to load transport" }, { status: 500 });
  }
}
