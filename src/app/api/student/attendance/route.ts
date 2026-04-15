import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { verifyStudent, studentError } from "@/lib/verify-student";

export async function GET(req: NextRequest) {
  const auth = await verifyStudent();
  if (auth.error) return studentError(auth.error);

  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") || String(new Date().getMonth() + 1);
    const year = searchParams.get("year") || String(new Date().getFullYear());

    const studentId = auth.studentId;

    const records = await db.attendance.findMany({
      where: { student_id: studentId },
      select: {
        attendance_id: true,
        student_id: true,
        status: true,
        date: true,
        timestamp: true,
        year: true,
        term: true,
      },
      orderBy: { timestamp: "desc" },
    });

    // Calculate summary
    const present = records.filter(
      (r) => r.status === "present" || r.status === "1" || r.status === "late" || r.status === "3"
    ).length;
    const absent = records.filter(
      (r) => r.status === "absent" || r.status === "2"
    ).length;
    const late = records.filter(
      (r) => r.status === "late" || r.status === "3"
    ).length;
    const total = records.length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return NextResponse.json({
      records,
      summary: { present, absent, late, total, percentage },
    });
  } catch (error) {
    console.error("Student attendance error:", error);
    return NextResponse.json({ error: "Failed to load attendance" }, { status: 500 });
  }
}
