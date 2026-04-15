import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/verify-key
 * Matches original CI3 Crud_model::auth_verification($auth_key) method.
 *
 * Original logic:
 * 1. Loop through tables: admin, accountant, librarian, parent, student, teacher
 * 2. If user found AND block_limit == 3 → increment block_counter, return 'blocked'
 * 3. If user found AND not blocked → increment t_counter, flag if student
 * 4. Returns: 'blocked', 'true' (non-student), 'true_student', or 'false'
 *
 * Our Prisma schema uses active_status instead of block_limit:
 *   active_status = 1 → active
 *   active_status = 0 → blocked/deactivated
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key } = body;

    if (!key || typeof key !== "string" || key.trim().length === 0) {
      return NextResponse.json(
        { valid: false, message: "Authentication key is required" },
        { status: 400 }
      );
    }

    const authKey = key.trim();

    // Table order matches original CI3: admin, accountant, librarian, parent, student, teacher
    const tables = [
      { model: "admin" as const, role: "admin" },
      { model: "accountant" as const, role: "accountant" },
      { model: "librarian" as const, role: "librarian" },
      { model: "parent" as const, role: "parent" },
      { model: "student" as const, role: "student", isStudent: true },
      { model: "teacher" as const, role: "teacher" },
    ];

    let isBlocked = false;
    let matchedRole: string | null = null;
    let matchedIsStudent = false;

    for (const table of tables) {
      try {
        const user = await db[table.model].findFirst({
          where: { authentication_key: authKey },
        });

        if (user) {
          // Check if blocked (original: block_limit == 3, ours: active_status !== 1)
          if (user.active_status !== 1) {
            isBlocked = true;
            // Don't break — continue checking to match original behavior
            // (original checks all tables before returning 'blocked')
          } else {
            // Valid match found
            matchedRole = table.role;
            matchedIsStudent = !!table.isStudent;
            // First match wins (same as original — first non-blocked match)
            break;
          }
        }
      } catch {
        // Table might not exist or have authentication_key field
        continue;
      }
    }

    // Return in same format as original CI3 response
    if (isBlocked) {
      return NextResponse.json({
        valid: false,
        blocked: true,
        message: "Your account has been blocked. Please contact your administrator.",
      });
    }

    if (matchedRole) {
      return NextResponse.json({
        valid: true,
        type: matchedRole,
        isStudent: matchedIsStudent,
      });
    }

    return NextResponse.json({
      valid: false,
      message: "Invalid authentication key.",
    });
  } catch (error) {
    console.error("Auth key verification error:", error);
    return NextResponse.json(
      { valid: false, message: "An error occurred during verification." },
      { status: 500 }
    );
  }
}
