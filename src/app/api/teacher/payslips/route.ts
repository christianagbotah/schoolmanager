import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireTeacher } from "@/lib/teacher-auth";

// GET /api/teacher/payslips — teacher's payslips
export async function GET(request: Request) {
  // Try session auth first
  const { error, teacher } = await requireTeacher();

  let employeeCode: string;

  if (error) {
    // Demo fallback: no session — use the first teacher's code
    const demoTeacher = await db.teacher.findFirst({
      select: { teacher_code: true },
    });
    if (!demoTeacher) {
      return NextResponse.json([]);
    }
    employeeCode = demoTeacher.teacher_code;
  } else {
    employeeCode = teacher!.teacher_code;
  }

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") || undefined;
    const year = searchParams.get("year") || undefined;

    const payslips = await db.pay_salary.findMany({
      where: {
        employee_code: employeeCode,
        ...(month ? { month } : {}),
        ...(year ? { year } : {}),
      },
      include: {
        employee: {
          select: {
            emp_id: true,
            name: true,
            designation: { select: { name: true } },
            department: { select: { name: true } },
          },
        },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return NextResponse.json(payslips);
  } catch (err) {
    console.error("Teacher payslips error:", err);
    return NextResponse.json({ error: "Failed to load payslips" }, { status: 500 });
  }
}
