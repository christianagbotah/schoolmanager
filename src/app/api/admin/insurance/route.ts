import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    const insurances = await db.insurance.findMany({
      orderBy: { id: "desc" },
    });

    if (action === "stats" || !action) {
      const students = await db.student.findMany({
        where: { active_status: 1 },
        select: { student_id: true, name: true, student_code: true, sex: true },
      });

      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const totalInsured = insurances.length;
      const activePolicies = insurances.filter((i) => i.status === "Active").length;
      const expiringSoon = insurances.filter(
        (i) => i.end_date && i.status === "Active" && i.end_date <= thirtyDaysFromNow && i.end_date > now
      ).length;
      const totalCoverage = insurances.reduce((s, i) => s + i.coverage_amount, 0);

      return NextResponse.json({
        insurances,
        students,
        stats: { totalInsured, activePolicies, expiringSoon, totalCoverage },
      });
    }

    return NextResponse.json({ insurances });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...data } = body;

    if (action === "create") {
      const insurance = await db.insurance.create({
        data: {
          student_id: Number(data.student_id),
          provider_name: data.provider_name || "",
          policy_number: data.policy_number || "",
          coverage_amount: Number(data.coverage_amount) || 0,
          premium: Number(data.premium) || 0,
          start_date: data.start_date ? new Date(data.start_date) : null,
          end_date: data.end_date ? new Date(data.end_date) : null,
          status: data.status || "Active",
          auto_renewal: data.auto_renewal ? 1 : 0,
        },
      });
      return NextResponse.json({ insurance });
    }

    if (action === "update") {
      const insurance = await db.insurance.update({
        where: { id: Number(data.id) },
        data: {
          student_id: data.student_id !== undefined ? Number(data.student_id) : undefined,
          provider_name: data.provider_name ?? undefined,
          policy_number: data.policy_number ?? undefined,
          coverage_amount: data.coverage_amount !== undefined ? Number(data.coverage_amount) : undefined,
          premium: data.premium !== undefined ? Number(data.premium) : undefined,
          start_date: data.start_date ? new Date(data.start_date) : null,
          end_date: data.end_date ? new Date(data.end_date) : null,
          status: data.status ?? undefined,
          auto_renewal: data.auto_renewal !== undefined ? (data.auto_renewal ? 1 : 0) : undefined,
        },
      });
      return NextResponse.json({ insurance });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await db.insurance.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
