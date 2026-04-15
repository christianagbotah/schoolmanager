import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/admin/subjects/import
 * Import subjects from one class to another. Mirrors CI3 do_subjects_import.
 * Body: { source_class_id, target_class_id }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source_class_id, target_class_id } = body;

    if (!source_class_id || !target_class_id) {
      return NextResponse.json(
        { error: "source_class_id and target_class_id are required" },
        { status: 400 }
      );
    }

    if (parseInt(source_class_id) === parseInt(target_class_id)) {
      return NextResponse.json(
        { error: "Please select a different class" },
        { status: 400 }
      );
    }

    // Get settings
    const settings = await db.settings.findMany({
      where: { type: { in: ["running_year", "running_term", "running_sem"] } },
    });
    const runningYear = settings.find((s) => s.type === "running_year")?.description || "";
    const runningTerm = parseInt(
      settings.find((s) => s.type === "running_term")?.description || "0",
      10
    );
    const runningSem = parseInt(
      settings.find((s) => s.type === "running_sem")?.description || "0",
      10
    );

    const targetClass = await db.school_class.findUnique({
      where: { class_id: parseInt(target_class_id, 10) },
    });

    if (!targetClass) {
      return NextResponse.json({ error: "Target class not found" }, { status: 404 });
    }

    // Check if target class already has subjects
    const existingCount = await db.subject.count({
      where: {
        class_id: parseInt(target_class_id, 10),
        year: runningYear,
        ...(targetClass?.name === "JHSS"
          ? { sem: runningSem }
          : { term: runningTerm }),
      },
    });

    if (existingCount > 0) {
      return NextResponse.json(
        { error: "This class already has subjects registered" },
        { status: 400 }
      );
    }

    // Get source subjects
    const sourceWhere: Record<string, unknown> = {
      class_id: parseInt(source_class_id, 10),
      year: runningYear,
    };

    const sourceClass = await db.school_class.findUnique({
      where: { class_id: parseInt(source_class_id, 10) },
    });

    if (sourceClass?.name === "JHSS") {
      sourceWhere.sem = runningSem;
    } else {
      sourceWhere.term = runningTerm;
    }

    const sourceSubjects = await db.subject.findMany({
      where: sourceWhere,
    });

    if (sourceSubjects.length === 0) {
      return NextResponse.json(
        { error: "No subjects found in source class" },
        { status: 400 }
      );
    }

    // Copy subjects to target class
    for (const subject of sourceSubjects) {
      await db.subject.create({
        data: {
          name: subject.name,
          class_id: parseInt(target_class_id, 10),
          year: runningYear,
          term: subject.term,
          sem: subject.sem,
          teacher_id: subject.teacher_id,
          status: subject.status,
        },
      });
    }

    return NextResponse.json({
      status: "success",
      message: `${sourceSubjects.length} subject(s) imported successfully`,
    });
  } catch (error) {
    console.error("[Admin Subjects Import API] Error:", error);
    return NextResponse.json(
      { error: "Failed to import subjects" },
      { status: 500 }
    );
  }
}
