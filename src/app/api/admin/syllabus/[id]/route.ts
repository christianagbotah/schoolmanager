import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * DELETE /api/admin/syllabus/[id]
 * Deletes a syllabus record. Mirrors CI3 delete_academic_syllabus().
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const syllabusId = parseInt(id, 10);

    const syllabus = await db.academic_syllabus.findUnique({
      where: { syllabus_id: syllabusId },
    });

    if (!syllabus) {
      return NextResponse.json({ error: "Syllabus not found" }, { status: 404 });
    }

    await db.academic_syllabus.delete({ where: { syllabus_id: syllabusId } });

    return NextResponse.json({ message: "done", route: "academic_syllabus" });
  } catch (error) {
    console.error("[Admin Syllabus API] Error deleting syllabus:", error);
    return NextResponse.json({ error: "Failed to delete syllabus" }, { status: 500 });
  }
}
