import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/admin/departments
 * Returns all departments for dropdown selections.
 */
export async function GET() {
  try {
    const departments = await db.department.findMany({
      orderBy: { dep_name: "asc" },
    });
    return NextResponse.json(departments);
  } catch (error) {
    console.error("[Departments API] Error:", error);
    return NextResponse.json({ error: "Failed to load departments" }, { status: 500 });
  }
}
