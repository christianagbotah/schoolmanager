import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    const requests = await db.maintenance_request.findMany({
      orderBy: { created_at: "desc" },
    });

    if (action === "stats" || !action) {
      const total = requests.length;
      const open = requests.filter((r) => r.status === "Open").length;
      const inProgress = requests.filter((r) => r.status === "In Progress").length;
      const completed = requests.filter((r) => r.status === "Completed" || r.status === "Closed").length;

      return NextResponse.json({
        requests,
        stats: { total, open, inProgress, completed },
      });
    }

    return NextResponse.json({ requests });
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
      const request = await db.maintenance_request.create({
        data: {
          title: data.title || "",
          description: data.description || "",
          priority: data.priority || "Medium",
          category: data.category || "Other",
          location: data.location || "",
          reported_by: data.reported_by || "",
          status: "Open",
        },
      });
      return NextResponse.json({ request });
    }

    if (action === "update") {
      const request = await db.maintenance_request.update({
        where: { id: Number(data.id) },
        data: {
          title: data.title ?? undefined,
          description: data.description ?? undefined,
          priority: data.priority ?? undefined,
          category: data.category ?? undefined,
          location: data.location ?? undefined,
          reported_by: data.reported_by ?? undefined,
          status: data.status ?? undefined,
        },
      });
      return NextResponse.json({ request });
    }

    if (action === "update_status") {
      const validTransitions: Record<string, string[]> = {
        "Open": ["In Progress"],
        "In Progress": ["Completed"],
        "Completed": ["Closed"],
      };
      const existing = await db.maintenance_request.findUnique({
        where: { id: Number(data.id) },
      });
      if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const allowed = validTransitions[existing.status];
      if (!allowed || !allowed.includes(data.status)) {
        return NextResponse.json({ error: `Cannot transition from ${existing.status} to ${data.status}` }, { status: 400 });
      }

      const request = await db.maintenance_request.update({
        where: { id: Number(data.id) },
        data: { status: data.status },
      });
      return NextResponse.json({ request });
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

    await db.maintenance_request.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
