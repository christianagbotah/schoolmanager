import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/admin/sections/[id]
 * Fetches single section with relations.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const section = await db.section.findUnique({
      where: { section_id: parseInt(id, 10) },
      include: {
        teacher: { select: { teacher_id: true, name: true } },
        class: { select: { class_id: true, name: true, name_numeric: true, category: true } },
        _count: { select: { enrolls: true } },
      },
    });

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    return NextResponse.json(section);
  } catch (error) {
    console.error("[Admin Sections API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch section" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/sections/[id]
 * Updates section with duplicate check. Mirrors CI3 sections('edit', $param2).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, nick_name, numeric_name, teacher_id, class_id } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Section name is required" }, { status: 400 });
    }

    const sectionName = name.trim().toUpperCase();
    const sectionId = parseInt(id, 10);
    const targetClassId = class_id ? parseInt(class_id, 10) : null;

    // Duplicate check (mirrors CI3 duplication_of_section_on_edit)
    const existing = await db.section.findFirst({
      where: {
        class_id: targetClassId,
        name: sectionName,
        section_id: { not: sectionId },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Duplicate section name is not allowed for this class" },
        { status: 409 }
      );
    }

    const section = await db.section.update({
      where: { section_id: sectionId },
      data: {
        name: sectionName,
        nick_name: nick_name || "",
        numeric_name: numeric_name ? parseInt(numeric_name, 10) : 0,
        teacher_id: teacher_id ? parseInt(teacher_id, 10) : null,
        class_id: targetClassId,
      },
    });

    return NextResponse.json({ message: "Section updated successfully" });
  } catch (error) {
    console.error("[Admin Sections API] Error updating section:", error);
    return NextResponse.json({ error: "Failed to update section" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/sections/[id]
 * Deletes section. Mirrors CI3 sections('delete', $param2).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sectionId = parseInt(id, 10);

    // Check for enrolled students
    const enrollCount = await db.enroll.count({
      where: { section_id: sectionId },
    });

    if (enrollCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete section. ${enrollCount} student(s) are enrolled.` },
        { status: 400 }
      );
    }

    await db.section.delete({ where: { section_id: sectionId } });

    return NextResponse.json({ message: "done", route: "section" });
  } catch (error) {
    console.error("[Admin Sections API] Error deleting section:", error);
    return NextResponse.json({ error: "Failed to delete section" }, { status: 500 });
  }
}
