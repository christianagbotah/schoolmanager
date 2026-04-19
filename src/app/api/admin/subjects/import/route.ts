import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/admin/subjects/import
 * Import subjects - supports two modes:
 * 1. action=copy: Copy subjects from one class to another (CI3 do_subjects_import)
 * 2. action=mass: Import all subjects from previous year (CI3 do_subjects_import_mass)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, source_class_id, target_class_id } = body;

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

    // ── MASS IMPORT ────────────────────────────────────────────────────────
    if (action === "mass") {
      // Import all subjects from the previous academic year
      const prevYear = getPreviousYear(runningYear);

      if (!prevYear) {
        return NextResponse.json(
          { status: "error", message: "Could not determine previous academic year" },
          { status: 400 }
        );
      }

      // Get all classes
      const allClasses = await db.school_class.findMany();

      let importedCount = 0;
      for (const cls of allClasses) {
        // Get subjects from previous year for this class
        const prevWhere: Record<string, unknown> = {
          class_id: cls.class_id,
          year: prevYear,
        };
        if (cls.name === "JHSS") {
          prevWhere.sem = runningSem;
        } else {
          prevWhere.term = runningTerm;
        }

        const prevSubjects = await db.subject.findMany({ where: prevWhere });

        for (const subject of prevSubjects) {
          // Check if already exists for current year
          const existingWhere: Record<string, unknown> = {
            name: subject.name,
            class_id: cls.class_id,
            year: runningYear,
          };
          if (cls.name === "JHSS") {
            existingWhere.sem = runningSem;
          } else {
            existingWhere.term = runningTerm;
          }

          const existing = await db.subject.findFirst({ where: existingWhere });
          if (!existing) {
            await db.subject.create({
              data: {
                name: subject.name,
                class_id: cls.class_id,
                year: runningYear,
                term: subject.term,
                sem: subject.sem,
                teacher_id: subject.teacher_id,
                section_id: subject.section_id,
                status: subject.status,
              },
            });
            importedCount++;
          }
        }
      }

      if (importedCount === 0) {
        return NextResponse.json({
          status: "error",
          message: "Subjects were already registered for this year",
        });
      }

      return NextResponse.json({
        status: "success",
        message: `${importedCount} subjects imported successfully`,
      });
    }

    // ── CLASS-TO-CLASS COPY ───────────────────────────────────────────────
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

function getPreviousYear(currentYear: string): string | null {
  // Handle year formats like "2024/2025" or "2024-2025"
  const match = currentYear.match(/^(\d{4})[/\-](\d{4})$/);
  if (match) {
    const startYear = parseInt(match[1], 10);
    const prevStartYear = startYear - 1;
    const prevEndYear = startYear;
    return `${prevStartYear}/${prevEndYear}`;
  }
  // Handle plain year like "2024"
  const plainYear = parseInt(currentYear, 10);
  if (plainYear > 2000) {
    return String(plainYear - 1);
  }
  return null;
}
