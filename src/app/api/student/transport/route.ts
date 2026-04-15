import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { verifyStudent, studentError } from "@/lib/verify-student";

export async function GET() {
  const auth = await verifyStudent();
  if (auth.error) return studentError(auth.error);

  try {
    const routes = await db.transport.findMany({
      orderBy: { route_name: "asc" },
    });

    const routeList = routes.map((r) => ({
      route_id: r.transport_id,
      route_name: r.route_name,
      description: r.description,
      vehicle_number: r.vehicle_number,
      driver_name: "", // CI3 uses separate driver table
      driver_phone: "",
      fare: r.fare,
      facilities: r.facilities,
    }));

    return NextResponse.json({ routes: routeList });
  } catch (error) {
    console.error("Student transport error:", error);
    return NextResponse.json({ error: "Failed to load transport data" }, { status: 500 });
  }
}
