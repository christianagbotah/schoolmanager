import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/admin/classes
 * Lists all classes with teacher, sections, enroll counts.
 * Faithfully mirrors CI3 classes() list view.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";

    const where: Record<string, unknown> = {};
    if (category) where.category = category;

    const classes = await db.school_class.findMany({
      where,
      include: {
        teacher: { select: { teacher_id: true, name: true, teacher_code: true } },
        section: true,
        sections: {
          select: { section_id: true, name: true },
          orderBy: { name: "asc" },
        },
        _count: { select: { enrolls: true } },
      },
      orderBy: [
        { category: "asc" },
        { name_numeric: "asc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error("[Admin Classes API] Error:", error);
    return NextResponse.json({ error: "Failed to load classes" }, { status: 500 });
  }
}

/**
 * POST /api/admin/classes
 * Creates a new class + default section. Mirrors CI3 classes('create').
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      name_numeric,
      category,
      teacher_id,
      section_name,
      student_capacity,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Class name is required" }, { status: 400 });
    }
    if (!category) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    // Create class
    const schoolClass = await db.school_class.create({
      data: {
        name: name.trim().toUpperCase(),
        name_numeric: name_numeric ? parseInt(name_numeric, 10) : 0,
        category: category,
        teacher_id: teacher_id ? parseInt(teacher_id, 10) : null,
        student_capacity: student_capacity ? parseInt(student_capacity, 10) : 0,
      },
    });

    // Create default section (mirrors CI3: auto-creates section A)
    const secName = section_name?.trim() || "A";
    const section = await db.section.create({
      data: {
        name: secName.toUpperCase(),
        class_id: schoolClass.class_id,
        teacher_id: teacher_id ? parseInt(teacher_id, 10) : null,
      },
    });

    // Link section to class
    await db.school_class.update({
      where: { class_id: schoolClass.class_id },
      data: { section_id: section.section_id },
    });

    return NextResponse.json(
      {
        message: "Class created successfully",
        class_id: schoolClass.class_id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Admin Classes API] Error creating class:", error);
    return NextResponse.json({ error: "Failed to create class" }, { status: 500 });
  }
}
