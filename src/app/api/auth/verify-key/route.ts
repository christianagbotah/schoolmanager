import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key } = body;

    if (!key || typeof key !== "string" || key.trim().length === 0) {
      return NextResponse.json(
        { valid: false, message: "Authentication key is required" },
        { status: 400 }
      );
    }

    const authKey = key.trim();

    // Check all user tables for matching authentication_key
    // Order: admin, teacher, accountant, parent, librarian, student

    const admin = await db.admin.findFirst({
      where: { authentication_key: authKey },
    });
    if (admin) {
      if (admin.active_status !== 1) {
        return NextResponse.json({
          valid: false,
          blocked: true,
          message: "Your account has been deactivated.",
        });
      }
      return NextResponse.json({
        valid: true,
        type: "admin",
      });
    }

    const teacher = await db.teacher.findFirst({
      where: { authentication_key: authKey },
    });
    if (teacher) {
      if (teacher.active_status !== 1) {
        return NextResponse.json({
          valid: false,
          blocked: true,
          message: "Your account has been deactivated.",
        });
      }
      return NextResponse.json({
        valid: true,
        type: "teacher",
      });
    }

    const accountant = await db.accountant.findFirst({
      where: { authentication_key: authKey },
    });
    if (accountant) {
      if (accountant.active_status !== 1) {
        return NextResponse.json({
          valid: false,
          blocked: true,
          message: "Your account has been deactivated.",
        });
      }
      return NextResponse.json({
        valid: true,
        type: "accountant",
      });
    }

    const parent = await db.parent.findFirst({
      where: { authentication_key: authKey },
    });
    if (parent) {
      if (parent.active_status !== 1) {
        return NextResponse.json({
          valid: false,
          blocked: true,
          message: "Your account has been deactivated.",
        });
      }
      return NextResponse.json({
        valid: true,
        type: "parent",
      });
    }

    const librarian = await db.librarian.findFirst({
      where: { authentication_key: authKey },
    });
    if (librarian) {
      if (librarian.active_status !== 1) {
        return NextResponse.json({
          valid: false,
          blocked: true,
          message: "Your account has been deactivated.",
        });
      }
      return NextResponse.json({
        valid: true,
        type: "librarian",
      });
    }

    const student = await db.student.findFirst({
      where: { authentication_key: authKey },
    });
    if (student) {
      if (student.active_status !== 1) {
        return NextResponse.json({
          valid: false,
          blocked: true,
          message: "Your account has been deactivated.",
        });
      }
      return NextResponse.json({
        valid: true,
        type: "student",
      });
    }

    return NextResponse.json({
      valid: false,
      message: "Invalid authentication key.",
    });
  } catch (error) {
    console.error("Auth key verification error:", error);
    return NextResponse.json(
      { valid: false, message: "An error occurred during verification." },
      { status: 500 }
    );
  }
}
