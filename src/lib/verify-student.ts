import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Verifies that the current session belongs to a student.
 * Returns { studentId: number; error?: never } or { error: string; studentId?: never }
 */
export async function verifyStudent() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { error: "Authentication required" };
    }
    const role = session.user.role;
    if (role !== "student") {
      return { error: "Access denied. Student role required." };
    }
    const studentId = parseInt(session.user.id);
    if (isNaN(studentId)) {
      return { error: "Invalid student ID" };
    }
    return { studentId };
  } catch {
    return { error: "Authentication error" };
  }
}

export function studentError(message: string, status = 401) {
  return NextResponse.json({ error: message }, { status });
}
