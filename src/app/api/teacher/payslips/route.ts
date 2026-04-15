import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireTeacher } from "@/lib/teacher-auth";

// GET /api/teacher/payslips — teacher's payslips (placeholder)
export async function GET() {
  const { error, teacherId } = await requireTeacher();
  if (error) return error;

  try {
    // In a real system, payslips would be in a dedicated table
    // For now return empty array - the page handles empty state gracefully
    return NextResponse.json([]);
  } catch (err) {
    console.error("Teacher payslips error:", err);
    return NextResponse.json({ error: "Failed to load payslips" }, { status: 500 });
  }
}
