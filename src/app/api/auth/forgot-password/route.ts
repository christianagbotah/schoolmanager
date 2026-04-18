import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { success: false, message: "Email is required." },
        { status: 400 }
      );
    }

    const identifier = email.trim().toLowerCase();

    // Search across all user tables to find the account
    let foundUser: {
      userId: number;
      userEmail: string;
      userType: string;
    } | null = null;

    // Try admin
    const admin = await db.admin.findUnique({
      where: { email: identifier },
    });
    if (admin) {
      foundUser = { userId: admin.admin_id, userEmail: admin.email, userType: "admin" };
    }

    // Try teacher
    if (!foundUser) {
      const teacher = await db.teacher.findUnique({
        where: { email: identifier },
      });
      if (teacher) {
        foundUser = { userId: teacher.teacher_id, userEmail: teacher.email, userType: "teacher" };
      }
    }

    // Try student (email or username)
    if (!foundUser) {
      const student = await db.student.findFirst({
        where: identifier.includes("@")
          ? { email: identifier }
          : { username: identifier },
      });
      if (student) {
        foundUser = { userId: student.student_id, userEmail: student.email || identifier, userType: "student" };
      }
    }

    // Try parent
    if (!foundUser) {
      const parent = await db.parent.findUnique({
        where: { email: identifier },
      });
      if (parent) {
        foundUser = { userId: parent.parent_id, userEmail: parent.email, userType: "parent" };
      }
    }

    // Try accountant
    if (!foundUser) {
      const accountant = await db.accountant.findUnique({
        where: { email: identifier },
      });
      if (accountant) {
        foundUser = { userId: accountant.accountant_id, userEmail: accountant.email, userType: "accountant" };
      }
    }

    // Try librarian
    if (!foundUser) {
      const librarian = await db.librarian.findUnique({
        where: { email: identifier },
      });
      if (librarian) {
        foundUser = { userId: librarian.librarian_id, userEmail: librarian.email, userType: "librarian" };
      }
    }

    // If user found, generate and store a reset token
    if (foundUser) {
      // Delete any existing unused tokens for this email
      await db.reset_token.deleteMany({
        where: { email: foundUser.userEmail },
      });

      // Generate a secure random token
      const token = crypto.randomBytes(32).toString("hex");

      await db.reset_token.create({
        data: {
          token,
          email: foundUser.userEmail,
          user_type: foundUser.userType,
          user_id: foundUser.userId,
        },
      });

      // In production, send an email with the reset link:
      // `${origin}/reset-password?token=${token}`
      // For this demo, we just store the token and return success.
      // The dev log will show the token for testing purposes.
      console.log(`[PASSWORD RESET] Token generated for ${foundUser.userEmail} (${foundUser.userType}): ${token}`);
      console.log(`[PASSWORD RESET] Reset URL: /reset-password?token=${token}`);
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message:
        "If an account exists with this email, a reset link has been sent. (Note: email sending is simulated in this demo — check server logs for the reset token.)",
    });
  } catch (error) {
    console.error("[FORGOT PASSWORD ERROR]", error);
    return NextResponse.json(
      { success: false, message: "An internal error occurred. Please try again." },
      { status: 500 }
    );
  }
}
