import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const parentId = parseInt(session.user.id);

    const parent = await db.parent.findUnique({
      where: { parent_id: parentId },
      select: {
        parent_id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        profession: true,
        designation: true,
        guardian_gender: true,
        guardian_is_the: true,
        father_name: true,
        father_phone: true,
        mother_name: true,
        mother_phone: true,
        active_status: true,
      },
    });

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    // Get children
    const children = await db.student.findMany({
      where: { parent_id: parentId },
      select: {
        student_id: true,
        student_code: true,
        name: true,
        first_name: true,
        last_name: true,
        sex: true,
        mute: true,
        enrolls: {
          where: { mute: 0 },
          orderBy: { enroll_id: "desc" },
          take: 1,
          select: {
            class: { select: { name: true, name_numeric: true } },
            section: { select: { name: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ ...parent, children });
  } catch (error) {
    console.error("Parent profile error:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const parentId = parseInt(session.user.id);
    const body = await req.json();

    // Handle password change
    if (body.password) {
      const { password } = body;
      if (password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }
      await db.parent.update({
        where: { parent_id: parentId },
        data: { password },
      });
      return NextResponse.json({ success: true, message: "Password updated successfully" });
    }

    // Handle profile update
    const { email, phone, address, profession, father_name, father_phone, mother_name, mother_phone } = body;
    const updateData: Record<string, string> = {};
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (profession !== undefined) updateData.profession = profession;
    if (father_name !== undefined) updateData.father_name = father_name;
    if (father_phone !== undefined) updateData.father_phone = father_phone;
    if (mother_name !== undefined) updateData.mother_name = mother_name;
    if (mother_phone !== undefined) updateData.mother_phone = mother_phone;

    const updated = await db.parent.update({
      where: { parent_id: parentId },
      data: updateData,
      select: { parent_id: true, name: true, email: true, phone: true },
    });

    return NextResponse.json({ success: true, message: "Profile updated successfully", parent: updated });
  } catch (error) {
    console.error("Parent profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
