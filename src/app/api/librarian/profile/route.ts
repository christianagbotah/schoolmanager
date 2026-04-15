import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/librarian/profile - Get librarian profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const librarianId = parseInt(session.user.id);
    const librarian = await db.librarian.findUnique({
      where: { librarian_id: librarianId },
      select: {
        librarian_id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        active_status: true,
      },
    });

    if (!librarian) {
      return NextResponse.json({ error: "Librarian not found" }, { status: 404 });
    }

    // Library statistics for the profile
    const bookCount = await db.book.count();
    const issuedCount = await db.book_request.count({ where: { status: "issued" } });
    const pendingCount = await db.book_request.count({ where: { status: "pending" } });

    return NextResponse.json({
      ...librarian,
      stats: { bookCount, issuedCount, pendingCount },
    });
  } catch (error) {
    console.error("Librarian profile error:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

// PUT /api/librarian/profile - Update librarian profile
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const librarianId = parseInt(session.user.id);
    const body = await req.json();

    // Handle password change
    if (body.password) {
      const { password } = body;
      if (password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }
      await db.librarian.update({
        where: { librarian_id: librarianId },
        data: { password },
      });
      return NextResponse.json({ success: true, message: "Password updated successfully" });
    }

    // Handle profile update
    const { email, phone, address } = body;
    const updateData: Record<string, string> = {};
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;

    const updated = await db.librarian.update({
      where: { librarian_id: librarianId },
      data: updateData,
      select: { librarian_id: true, name: true, email: true, phone: true },
    });

    return NextResponse.json({ success: true, message: "Profile updated successfully", librarian: updated });
  } catch (error: any) {
    console.error("Librarian profile update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 });
  }
}
