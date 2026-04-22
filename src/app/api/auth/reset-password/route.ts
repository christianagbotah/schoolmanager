import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

const TOKEN_EXPIRY_HOURS = 1;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, newPassword, confirmPassword } = body;

    // Validate inputs
    if (!token || typeof token !== "string" || !token.trim()) {
      return NextResponse.json(
        { success: false, message: "Reset token is required." },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string") {
      return NextResponse.json(
        { success: false, message: "New password is required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: "Passwords do not match." },
        { status: 400 }
      );
    }

    // Find the reset token
    const resetRecord = await db.reset_token.findUnique({
      where: { token: token.trim() },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired reset token." },
        { status: 400 }
      );
    }

    // Check if token has already been used
    if (resetRecord.used === 1) {
      return NextResponse.json(
        { success: false, message: "This reset token has already been used. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if token is expired (1 hour)
    const now = new Date();
    const createdAt = new Date(resetRecord.created_at);
    const expiryMs = TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;
    if (now.getTime() - createdAt.getTime() > expiryMs) {
      // Clean up expired token
      await db.reset_token.delete({ where: { id: resetRecord.id } });
      return NextResponse.json(
        { success: false, message: "This reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the user's password in the appropriate table
    const { user_type, user_id } = resetRecord;

    try {
      switch (user_type) {
        case "admin":
          await db.admin.update({
            where: { admin_id: user_id },
            data: { password: hashedPassword },
          });
          break;
        case "teacher":
          await db.teacher.update({
            where: { teacher_id: user_id },
            data: { password: hashedPassword },
          });
          break;
        case "student":
          await db.student.update({
            where: { student_id: user_id },
            data: { password: hashedPassword },
          });
          break;
        case "parent":
          await db.parent.update({
            where: { parent_id: user_id },
            data: { password: hashedPassword },
          });
          break;
        case "accountant":
          await db.accountant.update({
            where: { accountant_id: user_id },
            data: { password: hashedPassword },
          });
          break;
        case "librarian":
          await db.librarian.update({
            where: { librarian_id: user_id },
            data: { password: hashedPassword },
          });
          break;
        default:
          return NextResponse.json(
            { success: false, message: "Unknown user type." },
            { status: 400 }
          );
      }
    } catch {
      return NextResponse.json(
        { success: false, message: "Failed to update password. The user account may not exist." },
        { status: 500 }
      );
    }

    // Mark the token as used
    await db.reset_token.update({
      where: { id: resetRecord.id },
      data: { used: 1 },
    });

    // Clean up any other unused tokens for this email
    await db.reset_token.deleteMany({
      where: { email: resetRecord.email },
    });

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("[RESET PASSWORD ERROR]", error);
    return NextResponse.json(
      { success: false, message: "An internal error occurred. Please try again." },
      { status: 500 }
    );
  }
}
