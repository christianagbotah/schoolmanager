import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/admin/sections
 * Lists sections optionally filtered by class_id.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("class_id");

    const where: Record<string, unknown> = {};
    if (classId) where.class_id = parseInt(classId, 10);

    const sections = await db.section.findMany({
      where,
      include: {
        teacher: { select: { teacher_id: true, name: true } },
        class: { select: { class_id: true, name: true, name_numeric: true, category: true } },
        _count: { select: { enrolls: true } },
      },
      orderBy: [{ numeric_name: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(sections);
  } catch (error) {
    console.error("[Admin Sections API] Error:", error);
    return NextResponse.json({ error: "Failed to load sections" }, { status: 500 });
  }
}

/**
 * POST /api/admin/sections
 * Creates a section with duplicate name check. Mirrors CI3 sections('create').
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, nick_name, numeric_name, teacher_id, class_id } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Section name is required" }, { status: 400 });
    }
    if (!class_id) {
      return NextResponse.json({ error: "Class is required" }, { status: 400 });
    }

    const className = name.trim().toUpperCase();

    // Duplicate check (mirrors CI3 duplication_of_section_on_create)
    const existing = await db.section.findFirst({
      where: {
        class_id: parseInt(class_id, 10),
        name: className,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Duplicate section name is not allowed for this class" },
        { status: 409 }
      );
    }

    const section = await db.section.create({
      data: {
        name: className,
        nick_name: nick_name?.trim() || "",
        numeric_name: numeric_name ? parseInt(numeric_name, 10) : 0,
        teacher_id: teacher_id ? parseInt(teacher_id, 10) : null,
        class_id: parseInt(class_id, 10),
      },
      include: {
        teacher: { select: { teacher_id: true, name: true } },
        class: { select: { class_id: true, name: true, name_numeric: true } },
      },
    });

    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    console.error("[Admin Sections API] Error creating section:", error);
    return NextResponse.json({ error: "Failed to create section" }, { status: 500 });
  }
}
