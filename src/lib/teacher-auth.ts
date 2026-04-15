import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { UserRole } from "@/lib/auth";

/**
 * Get the authenticated teacher from the session.
 * Returns { teacher, teacherId } or null/401.
 */
export async function getAuthenticatedTeacher() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  const role = session.user.role as UserRole;

  // Teachers can also be "super-admin" or "admin" for debugging, but in production only "teacher"
  if (role !== "teacher") {
    return null;
  }

  const teacherId = parseInt(session.user.id);
  if (!teacherId || isNaN(teacherId)) {
    return null;
  }

  const teacher = await db.teacher.findUnique({
    where: { teacher_id },
    include: {
      department: true,
      designation: true,
    },
  });

  if (!teacher) {
    return null;
  }

  return { teacher, teacherId };
}

/**
 * Use in API routes to require teacher authentication.
 * Returns { teacher, teacherId } or NextResponse with 401.
 */
export async function requireTeacher() {
  const result = await getAuthenticatedTeacher();
  if (!result) {
    return {
      error: NextResponse.json(
        { error: "Teacher authentication required" },
        { status: 401 }
      ),
      teacher: null,
      teacherId: 0,
    };
  }
  return {
    error: null,
    teacher: result.teacher,
    teacherId: result.teacherId,
  };
}
