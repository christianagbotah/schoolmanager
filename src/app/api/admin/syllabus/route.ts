import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

/**
 * GET /api/admin/syllabus
 * Lists syllabus records optionally filtered by class_id.
 * Mirrors CI3 academic_syllabus view.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("class_id");

    const where: Record<string, unknown> = {};
    if (classId) where.class_id = parseInt(classId, 10);

    const syllabus = await db.academic_syllabus.findMany({
      where,
      include: {
        class: { select: { class_id: true, name: true, name_numeric: true } },
        subject: { select: { subject_id: true, name: true } },
      },
      orderBy: { timestamp: "desc" },
    });

    return NextResponse.json(syllabus);
  } catch (error) {
    console.error("[Admin Syllabus API] Error:", error);
    return NextResponse.json({ error: "Failed to load syllabus" }, { status: 500 });
  }
}

/**
 * POST /api/admin/syllabus
 * Creates a syllabus record. Mirrors CI3 upload_academic_syllabus().
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, class_id, subject_id, file_name, uploader_type, uploader_id } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!class_id) {
      return NextResponse.json({ error: "Class is required" }, { status: 400 });
    }
    if (!subject_id) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 });
    }

    // Get running year from settings
    const runningYearSetting = await db.settings.findFirst({
      where: { type: "running_year" },
    });
    const year = runningYearSetting?.description || new Date().getFullYear().toString();

    // Generate unique code (mirrors CI3: substr(md5(rand(0, 1000000)), 0, 7))
    const code = randomBytes(4).toString("hex").substring(0, 7).toUpperCase();

    const syllabus = await db.academic_syllabus.create({
      data: {
        academic_syllabus_code: code,
        title: title.trim(),
        description: description?.trim() || "",
        class_id: parseInt(class_id, 10),
        subject_id: parseInt(subject_id, 10),
        uploader_type: uploader_type || "admin",
        uploader_id: uploader_id ? parseInt(uploader_id, 10) : 0,
        year: year,
        timestamp: Math.floor(Date.now() / 1000),
        file_name: file_name || "",
        upload_date: new Date(),
      },
    });

    return NextResponse.json(
      {
        message: "Syllabus uploaded successfully",
        syllabus_id: syllabus.syllabus_id,
        academic_syllabus_code: code,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Admin Syllabus API] Error creating syllabus:", error);
    return NextResponse.json({ error: "Failed to create syllabus" }, { status: 500 });
  }
}
