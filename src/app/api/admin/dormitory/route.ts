import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET - List dormitories or get students for a dormitory
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const dormitoryId = searchParams.get("dormitory_id");

    // Get students assigned to a specific dormitory (CI3 modal_dormitory_student)
    if (action === "students" && dormitoryId) {
      const assignments = await db.boarding_student.findMany({
        where: {
          dormitory_id: parseInt(dormitoryId),
          is_active: 1,
        },
        include: {
          student: {
            select: {
              student_id: true,
              name: true,
              email: true,
              phone: true,
              student_code: true,
              active_status: true,
              enrolls: {
                select: { class_id: true },
                take: 1,
                orderBy: { enroll_id: "desc" },
              },
            },
          },
        },
        orderBy: { id: "asc" },
      });

      // Enrich with class names
      const enriched = await Promise.all(
        assignments.map(async (a) => {
          let class_name = "";
          if (a.student.enrolls.length > 0) {
            const cls = await db.school_class.findUnique({
              where: { class_id: a.student.enrolls[0].class_id },
              select: { name: true },
            });
            class_name = cls?.name || "";
          }
          return {
            ...a,
            student: { ...a.student, class_name },
          };
        })
      );

      return NextResponse.json({ students: enriched });
    }

    // Default: list all dormitories
    const dormitories = await db.dormitory.findMany({
      orderBy: { dormitory_id: "desc" },
    });

    // Count students per dormitory
    const studentCounts = await db.boarding_student.groupBy({
      by: ["dormitory_id"],
      where: { is_active: 1, dormitory_id: { not: null } },
      _count: { student_id: true },
    });

    const countMap = new Map(
      studentCounts.map((c) => [c.dormitory_id, c._count.student_id])
    );

    const dormitoriesWithCount = dormitories.map((d) => ({
      ...d,
      students_count: countMap.get(d.dormitory_id) || 0,
    }));

    return NextResponse.json({ dormitories: dormitoriesWithCount });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Create or update dormitory
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...data } = body;

    if (action === "create") {
      const { name, number_of_rooms, description } = data;
      if (!name) {
        return NextResponse.json(
          { error: "Dormitory name is required" },
          { status: 400 }
        );
      }

      const dormitory = await db.dormitory.create({
        data: {
          dormitory_name: name,
          number_of_rooms: parseInt(number_of_rooms) || 0,
          dormitory_description: description || "",
        },
      });

      return NextResponse.json({ dormitory }, { status: 201 });
    }

    if (action === "update") {
      const { dormitory_id, name, number_of_rooms, description } = data;
      if (!dormitory_id) {
        return NextResponse.json(
          { error: "Dormitory ID is required" },
          { status: 400 }
        );
      }

      const dormitory = await db.dormitory.update({
        where: { dormitory_id: parseInt(dormitory_id) },
        data: {
          dormitory_name: name ?? undefined,
          number_of_rooms:
            number_of_rooms !== undefined
              ? parseInt(number_of_rooms)
              : undefined,
          dormitory_description: description ?? undefined,
        },
      });

      return NextResponse.json({ dormitory });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE - Remove dormitory
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    // Remove student assignments for this dormitory
    await db.boarding_student.updateMany({
      where: { dormitory_id: parseInt(id) },
      data: { dormitory_id: null },
    });

    await db.dormitory.delete({
      where: { dormitory_id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
