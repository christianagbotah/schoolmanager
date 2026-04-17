import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "stats") {
      const rooms = await db.dormitory_room.findMany({
        include: { occupants: { where: { is_active: 1 } } },
      });

      const students = await db.student.findMany({
        where: { active_status: 1 },
        select: { student_id: true, name: true, student_code: true, sex: true },
      });

      const totalRooms = rooms.length;
      const occupied = rooms.filter((r) => r.occupants.length >= r.capacity).length;
      const available = totalRooms - occupied;
      const totalCapacity = rooms.reduce((s, r) => s + r.capacity, 0);
      const totalOccupants = rooms.reduce((s, r) => s + r.occupants.length, 0);

      return NextResponse.json({
        rooms,
        students,
        stats: { totalRooms, occupied, available, totalCapacity, totalOccupants },
      });
    }

    const rooms = await db.dormitory_room.findMany({
      include: {
        occupants: {
          where: { is_active: 1 },
        },
      },
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ rooms });
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
      const room = await db.dormitory_room.create({
        data: {
          room_name: data.room_name || "",
          room_number: data.room_number || "",
          room_type: data.room_type || "Single",
          capacity: Number(data.capacity) || 1,
          floor: Number(data.floor) || 1,
          facilities: Array.isArray(data.facilities) ? data.facilities.join(",") : (data.facilities || ""),
          status: data.status || "Available",
        },
      });
      return NextResponse.json({ room });
    }

    if (action === "update") {
      const room = await db.dormitory_room.update({
        where: { id: Number(data.id) },
        data: {
          room_name: data.room_name ?? undefined,
          room_number: data.room_number ?? undefined,
          room_type: data.room_type ?? undefined,
          capacity: data.capacity !== undefined ? Number(data.capacity) : undefined,
          floor: data.floor !== undefined ? Number(data.floor) : undefined,
          facilities: Array.isArray(data.facilities) ? data.facilities.join(",") : (data.facilities ?? undefined),
          status: data.status ?? undefined,
        },
      });
      return NextResponse.json({ room });
    }

    if (action === "assign_student") {
      const { room_id, student_id } = data;
      if (!room_id || !student_id) {
        return NextResponse.json({ error: "room_id and student_id required" }, { status: 400 });
      }

      // Check room capacity
      const room = await db.dormitory_room.findUnique({
        where: { id: Number(room_id) },
        include: { occupants: { where: { is_active: 1 } } },
      });
      if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
      if (room.occupants.length >= room.capacity) {
        return NextResponse.json({ error: "Room is at full capacity" }, { status: 400 });
      }

      // Deactivate existing assignment if any
      await db.dormitory_room_student.updateMany({
        where: { student_id: Number(student_id), is_active: 1 },
        data: { is_active: 0 },
      });

      const assignment = await db.dormitory_room_student.create({
        data: {
          room_id: Number(room_id),
          student_id: Number(student_id),
        },
      });

      // Update room status
      const updatedOccupants = room.occupants.length + 1;
      if (updatedOccupants >= room.capacity) {
        await db.dormitory_room.update({
          where: { id: Number(room_id) },
          data: { status: "Occupied" },
        });
      } else if (room.status === "Available" && updatedOccupants > 0) {
        await db.dormitory_room.update({
          where: { id: Number(room_id) },
          data: { status: "Occupied" },
        });
      }

      return NextResponse.json({ assignment });
    }

    if (action === "remove_student") {
      await db.dormitory_room_student.updateMany({
        where: {
          room_id: Number(data.room_id),
          student_id: Number(data.student_id),
          is_active: 1,
        },
        data: { is_active: 0 },
      });

      // Check if room is now empty
      const room = await db.dormitory_room.findUnique({
        where: { id: Number(data.room_id) },
        include: { occupants: { where: { is_active: 1 } } },
      });
      if (room && room.occupants.length === 0 && room.status !== "Maintenance") {
        await db.dormitory_room.update({
          where: { id: Number(data.room_id) },
          data: { status: "Available" },
        });
      }

      return NextResponse.json({ success: true });
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

    // Remove all occupant assignments first
    await db.dormitory_room_student.deleteMany({
      where: { room_id: Number(id) },
    });

    await db.dormitory_room.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
