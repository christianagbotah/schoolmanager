import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/admin/teachers/[id]/block
 * Blocks a teacher account (sets block_limit to 3).
 * Faithfully mirrors CI3 teacher/block.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const teacherId = parseInt(id, 10);

    const teacher = await db.teacher.findUnique({ where: { teacher_id: teacherId } });
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    await db.teacher.update({
      where: { teacher_id: teacherId },
      data: { block_limit: 3 },
    });

    return NextResponse.json({ message: "Teacher account blocked successfully" });
  } catch (error) {
    console.error("[Teachers API] Error blocking teacher:", error);
    return NextResponse.json({ error: "Failed to block teacher" }, { status: 500 });
  }
}
