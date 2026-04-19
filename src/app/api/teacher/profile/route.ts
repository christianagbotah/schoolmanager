import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/teacher-auth";
import bcrypt from "bcryptjs";

// GET /api/teacher/profile — teacher's own profile
export async function GET() {
  const { error, teacher, teacherId } = await requireTeacher();
  if (error) return error;

  try {
    return NextResponse.json(teacher);
  } catch (err) {
    console.error("Teacher profile error:", err);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

// PUT /api/teacher/profile — update teacher profile
export async function PUT(request: NextRequest) {
  const { error, teacherId } = await requireTeacher();
  if (error) return error;

  try {
    const body = await request.json();
    const { name, email, phone, address, password } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;

    if (password && password.length >= 6) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await db.teacher.update({
      where: { teacher_id: teacherId },
      data: updateData,
      include: { department: true, designation: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Update teacher profile error:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
