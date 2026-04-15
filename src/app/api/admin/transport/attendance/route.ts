import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, route_id, attendance_date, transport_direction, total_fare } = body;

    if (!student_id || !route_id) {
      return NextResponse.json({ error: 'student_id and route_id are required' }, { status: 400 });
    }

    // Check if student is already assigned to this route
    const existing = await db.bus_attendance.findFirst({
      where: {
        student_id: parseInt(student_id),
        route_id: parseInt(route_id),
      },
    });

    if (existing) {
      // Update existing record
      const updated = await db.bus_attendance.update({
        where: { bus_attendance_id: existing.bus_attendance_id },
        data: {
          attendance_date: attendance_date ? new Date(attendance_date) : new Date(),
          transport_direction: transport_direction || 'morning',
          total_fare: total_fare ? parseFloat(total_fare) : 0,
          status: 'present',
        },
      });
      return NextResponse.json(updated);
    }

    // Create new bus attendance record (assigns student to route)
    const record = await db.bus_attendance.create({
      data: {
        student_id: parseInt(student_id),
        route_id: parseInt(route_id),
        attendance_date: attendance_date ? new Date(attendance_date) : new Date(),
        transport_direction: transport_direction || 'morning',
        total_fare: total_fare ? parseFloat(total_fare) : 0,
        status: 'present',
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error assigning student to transport:', error);
    return NextResponse.json({ error: 'Failed to assign student to route' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('route_id');

    const where: Record<string, unknown> = {};
    if (routeId) {
      where.route_id = parseInt(routeId);
    }

    const records = await db.bus_attendance.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        student: {
          select: {
            student_id: true,
            name: true,
            student_code: true,
          },
        },
        transport: {
          select: {
            transport_id: true,
            route_name: true,
          },
        },
      },
      orderBy: { bus_attendance_id: 'desc' },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching transport attendance:', error);
    return NextResponse.json({ error: 'Failed to fetch transport records' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Record ID required' }, { status: 400 });

    await db.bus_attendance.delete({ where: { bus_attendance_id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing student from transport:', error);
    return NextResponse.json({ error: 'Failed to remove student' }, { status: 500 });
  }
}
