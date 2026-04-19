import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/admin/parents/[id]
 * Fetches a single parent by ID for editing.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parent = await db.parent.findUnique({
      where: { parent_id: parseInt(id, 10) },
      include: {
        students: { select: { student_id: true, name: true, student_code: true } },
        enrolls: {
          select: {
            enroll_id: true,
            student: { select: { student_id: true, name: true, student_code: true } },
            class: { select: { class_id: true, name: true } },
            section: { select: { section_id: true, name: true } },
            year: true,
            term: true,
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    return NextResponse.json(parent);
  } catch (error) {
    console.error("[Parents API] Error fetching parent:", error);
    return NextResponse.json({ error: "Failed to fetch parent" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/parents/[id]
 * Updates an existing parent. Faithfully mirrors CI3 parent/edit.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parentId = parseInt(id, 10);
    const body = await request.json();

    const {
      name,
      guardian_gender,
      guardian_is_the,
      email,
      phone,
      address,
      profession,
      designation,
    } = body;

    // Validation (matching original CI3 rules)
    const errors: string[] = [];
    if (!name?.trim()) errors.push("Parent Name is required");

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(", "), errors }, { status: 400 });
    }

    // Determine final email (CI3: if no email, use phone)
    const finalEmail = email?.trim() || phone?.trim() || "";

    // Email format validation (only if email is provided and different from phone)
    if (email?.trim() && email !== phone?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Could Not Update Your Data. Invalid Email Found!" },
          { status: 400 }
        );
      }
    }

    // Email uniqueness check (only if email is provided and different from phone)
    if (email?.trim() && email !== phone?.trim()) {
      const existing = await db.parent.findFirst({
        where: { email: email.toLowerCase(), NOT: { parent_id: parentId } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "This email address is not available" },
          { status: 409 }
        );
      }
    }

    // Update parent
    await db.parent.update({
      where: { parent_id: parentId },
      data: {
        name: name.trim().toUpperCase(),
        guardian_gender: guardian_gender || "Male",
        guardian_is_the: guardian_is_the || "",
        email: finalEmail.toLowerCase(),
        phone: phone?.trim() || "",
        address: address ? address.trim() : "",
        profession: profession ? profession.trim() : "",
        designation: designation ? designation.trim() : "",
        father_name: body.father_name?.trim() || "",
        father_phone: body.father_phone?.trim() || "",
        mother_name: body.mother_name?.trim() || "",
        mother_phone: body.mother_phone?.trim() || "",
      },
    });

    return NextResponse.json({ message: "Parent's data updated successfully" });
  } catch (error) {
    console.error("[Parents API] Error updating parent:", error);
    return NextResponse.json({ error: "Failed to update parent" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/parents/[id]
 * Deletes a parent. Faithfully mirrors CI3 parent/delete.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parentId = parseInt(id, 10);

    // Check if parent exists
    const parent = await db.parent.findUnique({ where: { parent_id: parentId } });
    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    // Check for children (both student.parent_id and enroll.parent_id)
    const studentCount = await db.student.count({ where: { parent_id: parentId } });
    const enrollCount = await db.enroll.count({ where: { parent_id: parentId } });
    const childrenCount = Math.max(studentCount, enrollCount);

    if (childrenCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete this parent. They have ${childrenCount} child(ren) linked via enrollment.`,
          hasChildren: true,
          childrenCount,
        },
        { status: 400 }
      );
    }

    // Clear student parent references
    await db.student.updateMany({
      where: { parent_id: parentId },
      data: { parent_id: null },
    });

    // Clear enroll parent references
    await db.enroll.updateMany({
      where: { parent_id: parentId },
      data: { parent_id: null },
    });

    // Delete parent
    await db.parent.delete({ where: { parent_id: parentId } });

    return NextResponse.json({ message: "Selected Parent Deleted Successfully!" });
  } catch (error) {
    console.error("[Parents API] Error deleting parent:", error);
    return NextResponse.json({ error: "Failed to delete parent" }, { status: 500 });
  }
}
