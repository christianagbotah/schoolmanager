import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/admin/teachers/generate-code
 * Generates the next teacher_code by reading settings and the last teacher code.
 * Faithfully mirrors CI3 get_generated_tid.
 */
export async function GET() {
  try {
    // Read settings: teacher_code_prefix and teacher_code_format
    const settings = await db.settings.findMany({
      where: { type: { in: ["teacher_code_prefix", "teacher_code_format"] } },
    });

    const prefixSetting = settings.find((s) => s.type === "teacher_code_prefix");
    const formatSetting = settings.find((s) => s.type === "teacher_code_format");

    const prefix = prefixSetting?.description || "TCH";
    const format = formatSetting?.description || "0001";

    // Get the last teacher_code
    const lastTeacher = await db.teacher.findFirst({
      where: { teacher_code: { not: "" } },
      orderBy: { teacher_code: "desc" },
      select: { teacher_code: true },
    });

    let nextCode: string;

    if (lastTeacher && lastTeacher.teacher_code) {
      const tId = lastTeacher.teacher_code;

      // Find the position of the first digit
      let firstNum = "";
      let posOfFirstNum = -1;
      for (let i = 0; i < tId.length; i++) {
        if (/\d/.test(tId[i])) {
          firstNum = tId[i];
          posOfFirstNum = i;
          break;
        }
      }

      if (posOfFirstNum >= 0) {
        const numericPart = tId.substring(posOfFirstNum);
        const numVal = parseInt(numericPart, 10) + 1;

        if (firstNum === "0") {
          // Preserve leading zeros
          const oldLen = numericPart.length;
          const newLen = String(numVal).length;
          const padCount = oldLen - newLen;
          nextCode = prefix + "0".repeat(Math.max(0, padCount)) + numVal;
        } else {
          nextCode = prefix + numVal;
        }
      } else {
        nextCode = prefix + format;
      }
    } else {
      nextCode = prefix + format;
    }

    return NextResponse.json({ teacher_code: nextCode });
  } catch (error) {
    console.error("[Teachers API] Error generating teacher code:", error);
    return NextResponse.json({ error: "Failed to generate teacher code" }, { status: 500 });
  }
}
