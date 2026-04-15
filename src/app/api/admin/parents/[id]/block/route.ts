import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/admin/parents/[id]/block
 * Blocks a parent account (sets block_limit to 3).
 * Faithfully mirrors CI3 parent/block.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parentId = parseInt(id, 10);

    const parent = await db.parent.findUnique({ where: { parent_id: parentId } });
    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    await db.parent.update({
      where: { parent_id: parentId },
      data: { block_limit: 3 },
    });

    return NextResponse.json({ message: "User account blocked successfully" });
  } catch (error) {
    console.error("[Parents API] Error blocking parent:", error);
    return NextResponse.json({ error: "Failed to block parent" }, { status: 500 });
  }
}
