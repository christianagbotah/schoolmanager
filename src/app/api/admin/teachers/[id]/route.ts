import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/admin/teachers/[id]
 * Fetches a single teacher by ID for editing.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const teacher = await db.teacher.findUnique({
      where: { teacher_id: parseInt(id, 10) },
      include: {
        designation: { select: { id: true, des_name: true } },
        department: { select: { id: true, dep_name: true } },
        classes: { select: { class_id: true, name: true, name_numeric: true } },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    return NextResponse.json(teacher);
  } catch (error) {
    console.error("[Teachers API] Error fetching teacher:", error);
    return NextResponse.json({ error: "Failed to fetch teacher" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/teachers/[id]
 * Updates an existing teacher. Faithfully mirrors CI3 teacher/do_update.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const teacherId = parseInt(id, 10);
    const body = await request.json();

    const { first_name, other_name, last_name, email, phone, birthday, gender, address, designation_id, department_id, ghana_card_id, account_number, account_details } = body;

    // Validation (matching original CI3 rules)
    const errors: string[] = [];
    if (!first_name?.trim()) errors.push("First Name is required");
    if (!last_name?.trim()) errors.push("Last Name is required");
    if (!email?.trim()) errors.push("Email is required");
    if (!gender) errors.push("Gender is required");
    if (!phone?.trim()) errors.push("Phone Number is required");
    if (!birthday) errors.push("Date of birth is required");
    if (!ghana_card_id?.trim()) errors.push("Ghana Card is required");
    if (!account_number?.trim()) errors.push("Account number is required");
    if (!account_details?.trim()) errors.push("Account details is required");

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(", "), errors }, { status: 400 });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Could Not Update Your Data. Invalid Email Found!" }, { status: 400 });
    }

    // Email uniqueness check (exclude current teacher)
    const existingTeacher = await db.teacher.findFirst({
      where: { email: email.toLowerCase(), NOT: { teacher_id: teacherId } },
    });
    if (existingTeacher) {
      return NextResponse.json({ error: "This email address is not available" }, { status: 409 });
    }

    // Build name (matching original: FIRST OTHER LAST)
    const name = [first_name?.trim().toUpperCase(), other_name?.trim().toUpperCase(), last_name?.trim().toUpperCase()]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    // Update teacher
    await db.teacher.update({
      where: { teacher_id: teacherId },
      data: {
        name,
        first_name: first_name.trim().toUpperCase(),
        other_name: other_name?.trim().toUpperCase() || "",
        last_name: last_name.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || "",
        birthday: birthday ? new Date(birthday) : null,
        gender: gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase(),
        address: address ? address.charAt(0).toUpperCase() + address.slice(1).toLowerCase() : "",
        designation_id: designation_id ? parseInt(designation_id, 10) : null,
        department_id: department_id ? parseInt(department_id, 10) : null,
        ghana_card_id: ghana_card_id?.trim() || "",
        ssnit_id: body.ssnit_id?.trim() || "",
        petra_id: body.petra_id?.trim() || "",
        account_number: account_number?.trim() || "",
        account_details: account_details?.trim() || "",
      },
    });

    return NextResponse.json({ message: "Teacher updated successfully" });
  } catch (error) {
    console.error("[Teachers API] Error updating teacher:", error);
    return NextResponse.json({ error: "Failed to update teacher" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/teachers/[id]
 * Deletes a teacher. Faithfully mirrors CI3 teacher/delete.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const teacherId = parseInt(id, 10);

    // Check if teacher exists
    const teacher = await db.teacher.findUnique({ where: { teacher_id: teacherId } });
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Clear class/section teacher references
    await db.school_class.updateMany({
      where: { teacher_id: teacherId },
      data: { teacher_id: null },
    });
    await db.section.updateMany({
      where: { teacher_id: teacherId },
      data: { teacher_id: null },
    });
    await db.subject.updateMany({
      where: { teacher_id: teacherId },
      data: { teacher_id: null },
    });

    // Delete teacher
    await db.teacher.delete({ where: { teacher_id: teacherId } });

    return NextResponse.json({ message: "Teacher deleted successfully" });
  } catch (error) {
    console.error("[Teachers API] Error deleting teacher:", error);
    return NextResponse.json({ error: "Failed to delete teacher" }, { status: 500 });
  }
}
