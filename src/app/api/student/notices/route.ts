import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { verifyStudent, studentError } from "@/lib/verify-student";

export async function GET(req: NextRequest) {
  const auth = await verifyStudent();
  if (auth.error) return studentError(auth.error);

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const notices = await db.notice.findMany({
      where: {
        status: 1,
        OR: [
          { visibility_roles: "all" },
          { visibility_roles: { contains: "student" } },
          { visibility_roles: "" },
        ],
      },
      orderBy: [
        { create_timestamp: "desc" },
        { timestamp: "desc" },
      ],
      take: limit,
    });

    return NextResponse.json({ notices });
  } catch (error) {
    console.error("Student notices error:", error);
    return NextResponse.json({ error: "Failed to load notices" }, { status: 500 });
  }
}
