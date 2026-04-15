import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/block-account
 * Matches original CI3 Login::block_account() method.
 * After 3 failed auth key attempts, user can block their own account
 * by providing their email. Sets block_limit = 3 across all matching user tables.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string" || email.trim().length === 0) {
      return NextResponse.json(
        { found: false, message: "Email is required" },
        { status: 400 }
      );
    }

    const identifier = email.trim().toLowerCase();
    let found = false;

    // Check all 6 user tables (matches original CI3 block_account method)
    // Tables: admin, accountant, librarian, parent, student, teacher
    const tables = [
      { model: "admin" as const, field: "email" },
      { model: "accountant" as const, field: "email" },
      { model: "librarian" as const, field: "email" },
      { model: "parent" as const, field: "email" },
      { model: "teacher" as const, field: "email" },
    ];

    for (const table of tables) {
      try {
        const user = await db[table.model].findFirst({
          where: { [table.field]: identifier },
        });
        if (user) {
          found = true;
          // Set block_limit to 3 (matches original: $this->db->set('block_limit', 3))
          // Note: we use active_status field in our schema instead of block_limit
          // Setting active_status = 0 deactivates the account
          await db[table.model].updateMany({
            where: { [table.field]: identifier },
            data: { active_status: 0 },
          });
        }
      } catch {
        // Table might not have the field, continue
      }
    }

    // Student table also supports username login
    try {
      const student = await db.student.findFirst({
        where: {
          OR: [
            { email: identifier },
            { username: identifier },
          ],
        },
      });
      if (student) {
        found = true;
        await db.student.updateMany({
          where: {
            OR: [
              { email: identifier },
              { username: identifier },
            ],
          },
          data: { active_status: 0 },
        });
      }
    } catch {
      // Continue
    }

    return NextResponse.json({ found });
  } catch (error) {
    console.error("Block account error:", error);
    return NextResponse.json(
      { found: false, message: "An error occurred." },
      { status: 500 }
    );
  }
}
