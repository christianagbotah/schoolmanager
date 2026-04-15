import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/admin/designations
 * Returns all designations for dropdown selections.
 */
export async function GET() {
  try {
    const designations = await db.designation.findMany({
      orderBy: { des_name: "asc" },
    });
    return NextResponse.json(designations);
  } catch (error) {
    console.error("[Designations API] Error:", error);
    return NextResponse.json({ error: "Failed to load designations" }, { status: 500 });
  }
}
