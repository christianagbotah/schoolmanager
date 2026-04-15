import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/admin/subjects/[id]
 * Fetches a single subject for editing.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const subject = await db.subject.findUnique({
      where: { subject_id: parseInt(id, 10) },
      include: {
        class: {
          select: { class_id: true, name: true, name_numeric: true, category: true },
        },
        teacher: { select: { teacher_id: true, name: true } },
        section: { select: { section_id: true, name: true } },
      },
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    return NextResponse.json(subject);
  } catch (error) {
    console.error("[Admin Subject API] Error:", error);
    return NextResponse.json({ error: "Failed to load subject" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/subjects/[id]
 * Updates a subject. Mirrors CI3 subject('do_update').
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Subject name is required" }, { status: 400 });
    }

    const subjectId = parseInt(id, 10);

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

    const classId = parseInt(body.class_id, 10);
    const schoolClass = classId
      ? await db.school_class.findUnique({ where: { class_id: classId } })
      : null;

    const data: Record<string, unknown> = {
      name: body.name.trim(),
      class_id: classId || undefined,
      teacher_id: body.teacher_id ? parseInt(body.teacher_id, 10) : null,
      year: runningYear,
      status: body.status ? 1 : 0,
    };

    if (schoolClass?.name === "JHSS") {
      data.sem = runningSem;
    } else {
      data.term = runningTerm;
    }

    await db.subject.update({
      where: { subject_id: subjectId },
      data: data as never,
    });

    // Update subject status in mark table (mirrors CI3)
    try {
      const sectionId = classId
        ? (
            await db.section.findFirst({ where: { class_id: classId } })
          )?.section_id
        : null;

      if (sectionId) {
        const markWhere: Record<string, unknown> = {
          subject_id: subjectId,
          class_id: classId,
          year: runningYear,
          section_id: sectionId,
        };
        if (schoolClass?.name === "JHSS") {
          markWhere.sem = runningSem;
        } else {
          markWhere.term = runningTerm;
        }

        await db.mark.updateMany({
          where: markWhere,
          data: { comment: data.status === 1 ? "" : "inactive" },
        });
      }
    } catch {
      // Mark table update is best-effort, don't fail the whole operation
    }

    return NextResponse.json({
      status: "success",
      message: "Subject updated successfully",
    });
  } catch (error) {
    console.error("[Admin Subject API] Error updating:", error);
    return NextResponse.json({ error: "Failed to update subject" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/subjects/[id]
 * Deletes a subject. Mirrors CI3 subject('delete').
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const subjectId = parseInt(id, 10);

    await db.subject.delete({
      where: { subject_id: subjectId },
    });

    return NextResponse.json({
      status: "success",
      message: "Subject deleted successfully",
    });
  } catch (error) {
    console.error("[Admin Subject API] Error deleting:", error);
    return NextResponse.json({ error: "Failed to delete subject" }, { status: 500 });
  }
}
