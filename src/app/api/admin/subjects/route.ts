import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/admin/subjects?class_id=X
 * Lists subjects filtered by class_id with class/teacher relations.
 * Faithfully mirrors CI3 subject() list view.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("class_id");

    if (!classId) {
      return NextResponse.json({ error: "class_id is required" }, { status: 400 });
    }

    // Get running_year and running_term from settings
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

    // Get class to determine if JHSS
    const schoolClass = await db.school_class.findUnique({
      where: { class_id: parseInt(classId, 10) },
    });

    // Build filter based on class type (JHSS uses sem, others use term)
    const where: Record<string, unknown> = {
      class_id: parseInt(classId, 10),
      year: runningYear,
    };

    if (schoolClass?.name === "JHSS") {
      where.sem = runningSem;
    } else {
      where.term = runningTerm;
    }

    const subjects = await db.subject.findMany({
      where,
      include: {
        class: {
          select: { class_id: true, name: true, name_numeric: true, category: true },
        },
        teacher: { select: { teacher_id: true, name: true } },
        section: { select: { section_id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });

    // Check if class has more than one section with same name+numeric
    const classesWithSameName = schoolClass
      ? await db.school_class.count({
          where: {
            name: schoolClass.name,
            name_numeric: schoolClass.name_numeric,
          },
        })
      : 0;

    const sectionName =
      classesWithSameName > 1 && schoolClass?.section_id
        ? (
            await db.section.findUnique({
              where: { section_id: schoolClass.section_id },
            })
          )?.name || ""
        : "";

    return NextResponse.json({
      subjects,
      year: runningYear,
      term: runningTerm,
      sem: runningSem,
      class_name: schoolClass?.name || "",
      class_name_numeric: schoolClass?.name_numeric || 0,
      section_name: sectionName,
    });
  } catch (error) {
    console.error("[Admin Subjects API] Error:", error);
    return NextResponse.json(
      { error: "Failed to load subjects" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/subjects
 * Creates subjects (single or bulk). Mirrors CI3 subject('create') and create_bulk.
 * If body has `subjects` array, it's bulk. Otherwise single create.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

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

    // Bulk create
    if (body.subjects && Array.isArray(body.subjects)) {
      const classId = parseInt(body.class_id, 10);
      if (!classId) {
        return NextResponse.json({ error: "class_id is required" }, { status: 400 });
      }

      const schoolClass = await db.school_class.findUnique({
        where: { class_id: classId },
      });

      let successCount = 0;
      const errors: string[] = [];

      for (const subject of body.subjects) {
        if (!subject.name?.trim()) continue;

        const subjectName = subject.name.trim();

        const data: Record<string, unknown> = {
          name: subjectName,
          class_id: classId,
          year: runningYear,
          teacher_id: subject.teacher_id ? parseInt(subject.teacher_id, 10) : null,
          status: subject.status ? 1 : 0,
        };

        if (schoolClass?.name === "JHSS") {
          data.sem = runningSem;
        } else {
          data.term = runningTerm;
        }

        // Duplicate check
        const existing = await db.subject.findFirst({
          where: {
            name: subjectName,
            class_id: classId,
            year: runningYear,
            ...(schoolClass?.name === "JHSS"
              ? { sem: runningSem }
              : { term: runningTerm }),
          },
        });

        if (!existing) {
          await db.subject.create({ data: data as never });
          successCount++;
        } else {
          errors.push(`${subjectName} already exists`);
        }
      }

      if (successCount > 0) {
        let message = `${successCount} subject(s) created successfully`;
        if (errors.length > 0) {
          message += `. Skipped: ${errors.join(", ")}`;
        }
        return NextResponse.json({ status: "success", message });
      } else {
        return NextResponse.json(
          { status: "error", message: errors.length > 0 ? errors.join(", ") : "No subjects were created" },
          { status: 400 }
        );
      }
    }

    // Single create
    const classId = parseInt(body.class_id, 10);
    if (!classId || !body.name?.trim()) {
      return NextResponse.json(
        { error: "class_id and name are required" },
        { status: 400 }
      );
    }

    const schoolClass = await db.school_class.findUnique({
      where: { class_id: classId },
    });

    const subjectName = body.name.trim();

    // For JHSS, create for remaining semesters; for others, create for remaining terms
    if (schoolClass?.name === "JHSS") {
      const numSems = runningSem === 1 ? 2 : 1;
      let semCreate = runningSem;

      for (let i = 1; i <= numSems; i++) {
        await db.subject.create({
          data: {
            name: subjectName,
            class_id: classId,
            year: runningYear,
            sem: semCreate,
            teacher_id: body.teacher_id ? parseInt(body.teacher_id, 10) : null,
            status: body.status ? 1 : 0,
          },
        });
        semCreate++;
      }
    } else {
      const numTerms = runningTerm === 1 ? 3 : runningTerm === 2 ? 2 : 1;
      let termCreate = runningTerm;

      for (let i = 1; i <= numTerms; i++) {
        await db.subject.create({
          data: {
            name: subjectName,
            class_id: classId,
            year: runningYear,
            term: termCreate,
            teacher_id: body.teacher_id ? parseInt(body.teacher_id, 10) : null,
            status: body.status ? 1 : 0,
          },
        });
        termCreate++;
      }
    }

    return NextResponse.json({
      status: "success",
      message: "Subject added successfully",
    });
  } catch (error) {
    console.error("[Admin Subjects API] Error creating:", error);
    return NextResponse.json(
      { error: "Failed to create subject" },
      { status: 500 }
    );
  }
}
