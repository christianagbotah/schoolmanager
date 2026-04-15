import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { verifyStudent, studentError } from "@/lib/verify-student";
import bcrypt from "bcryptjs";

export async function GET() {
  const auth = await verifyStudent();
  if (auth.error) return studentError(auth.error);

  try {
    const student = await db.student.findUnique({
      where: { student_id: auth.studentId },
      select: {
        student_id: true,
        student_code: true,
        name: true,
        first_name: true,
        middle_name: true,
        last_name: true,
        email: true,
        phone: true,
        sex: true,
        blood_group: true,
        birthday: true,
        address: true,
        admission_date: true,
        username: true,
        active_status: true,
        parent: {
          select: { parent_id: true, name: true, phone: true, email: true },
        },
        enrolls: {
          include: {
            class: { select: { class_id: true, name: true, name_numeric: true, category: true } },
            section: { select: { section_id: true, name: true } },
          },
          orderBy: { enroll_id: "desc" },
        },
      },
    });

    if (!student) return studentError("Student not found", 404);

    return NextResponse.json(student);
  } catch (error) {
    console.error("Student profile fetch error:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await verifyStudent();
  if (auth.error) return studentError(auth.error);

  try {
    const body = await req.json();
    const studentId = auth.studentId;

    const existing = await db.student.findUnique({ where: { student_id: studentId } });
    if (!existing) return studentError("Student not found", 404);

    const updateData: Record<string, unknown> = {};

    // Students can only update limited fields (matching CI3 manage_profile)
    const allowedFields = ["email", "phone", "address"];
    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }

    // Handle password change
    if (body.password) {
      if (body.password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }
      const hashedPassword = await bcrypt.hash(body.password, 10);
      updateData.password = hashedPassword;
    }

    await db.student.update({
      where: { student_id: studentId },
      data: updateData,
    });

    return NextResponse.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Student profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
