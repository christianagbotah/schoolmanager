import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/admin/classes/[id]
 * Fetches a single class with relations for editing.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const schoolClass = await db.school_class.findUnique({
      where: { class_id: parseInt(id, 10) },
      include: {
        teacher: { select: { teacher_id: true, name: true, teacher_code: true } },
        section: { select: { section_id: true, name: true } },
        sections: {
          select: { section_id: true, name: true },
          orderBy: { name: "asc" },
        },
        _count: { select: { enrolls: true } },
      },
    });

    if (!schoolClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    return NextResponse.json(schoolClass);
  } catch (error) {
    console.error("[Admin Classes API] Error fetching class:", error);
    return NextResponse.json({ error: "Failed to fetch class" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/classes/[id]
 * Updates class. Mirrors CI3 classes('do_update', $param2).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, name_numeric, category, teacher_id } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Class name is required" }, { status: 400 });
    }

    const schoolClass = await db.school_class.update({
      where: { class_id: parseInt(id, 10) },
      data: {
        name: name.trim().toUpperCase(),
        name_numeric: name_numeric ? parseInt(name_numeric, 10) : 0,
        category: category || "",
        teacher_id: teacher_id ? parseInt(teacher_id, 10) : null,
      },
    });

    return NextResponse.json({
      message: "Class updated successfully",
      class_id: schoolClass.class_id,
    });
  } catch (error) {
    console.error("[Admin Classes API] Error updating class:", error);
    return NextResponse.json({ error: "Failed to update class" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/classes/[id]
 * Deletes class + associated fee rates. Mirrors CI3 classes('delete', $param2).
 * Checks if students are enrolled before deleting.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const classId = parseInt(id, 10);

    // Check for enrolled students
    const enrollCount = await db.enroll.count({
      where: { class_id: classId },
    });

    if (enrollCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete class. ${enrollCount} student(s) are enrolled. Remove or reassign students first.`,
        },
        { status: 400 }
      );
    }

    // Delete associated fee rates first
    await db.daily_fee_rates.deleteMany({ where: { class_id: classId } });

    // Delete associated sections
    await db.section.deleteMany({ where: { class_id: classId } });

    // Delete class
    await db.school_class.delete({ where: { class_id: classId } });

    return NextResponse.json({
      message: "Class deleted successfully",
      route: "classes",
    });
  } catch (error) {
    console.error("[Admin Classes API] Error deleting class:", error);
    return NextResponse.json({ error: "Failed to delete class" }, { status: 500 });
  }
}
