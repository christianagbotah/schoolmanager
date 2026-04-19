import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const include_students = searchParams.get('include_students') === 'true';
    const route_id = searchParams.get('route_id');

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { route_name: { contains: search } },
        { vehicle_number: { contains: search } },
        { description: { contains: search } },
        { facilities: { contains: search } },
      ];
    }
    if (route_id) {
      where.transport_id = parseInt(route_id);
    }

    const routes = await db.transport.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        bus_attendances: {
          distinct: ['student_id'],
          select: { student_id: true, bus_attendance_id: true, status: true },
        },
      },
      orderBy: { transport_id: 'desc' },
    });

    // Enrich with driver info
    const driverIds = routes.map(r => r.driver_id).filter(Boolean) as number[];
    const drivers = driverIds.length > 0
      ? await db.driver.findMany({
          where: { driver_id: { in: driverIds } },
          select: { driver_id: true, name: true, phone: true, status: true },
        })
      : [];
    const driverMap = new Map(drivers.map(d => [d.driver_id, d]));

    // Get all bus_attendance records for student enrichment
    let studentInfoMap = new Map<number, { name: string; student_code: string; class_name: string }>();
    if (include_students && routes.length > 0) {
      const routeIds = routes.map(r => r.transport_id);
      const allAttendances = await db.bus_attendance.findMany({
        where: { route_id: { in: routeIds } },
        distinct: ['student_id'],
        select: { student_id: true, student: { select: { name: true, student_code: true } } },
      });

      // Get class info for these students
      const studentIds = allAttendances.map(a => a.student_id);
      const enrolls = studentIds.length > 0
        ? await db.enroll.findMany({
            where: { student_id: { in: studentIds } },
            distinct: ['student_id'],
            select: {
              student_id: true,
              class: { select: { name: true, name_numeric: true } },
            },
            orderBy: { enroll_id: 'desc' },
          })
        : [];

      const enrollMap = new Map(enrolls.map(e => [e.student_id, e.class]));

      allAttendances.forEach(a => {
        const cls = enrollMap.get(a.student_id);
        studentInfoMap.set(a.student_id, {
          name: a.student.name,
          student_code: a.student.student_code,
          class_name: cls ? `${cls.name} ${cls.name_numeric}` : '',
        });
      });
    }

    const routesWithCount = routes.map(r => {
      // Auto-generate route_code like CI3: RT-{id padded to 3}
      const route_code = `RT-${String(r.transport_id).padStart(3, '0')}`;
      // Count stops from facilities (comma-separated list)
      const facilities = r.facilities || '';
      const stops = facilities.split(',').filter(Boolean).length;

      const result: Record<string, unknown> = {
        transport_id: r.transport_id,
        route_name: r.route_name,
        route_code,
        description: r.description,
        vehicle_number: r.vehicle_number,
        driver_id: r.driver_id,
        fare: r.fare,
        facilities: r.facilities,
        total_stops: stops,
        studentCount: r.bus_attendances.length,
        driver: r.driver_id ? driverMap.get(r.driver_id) || null : null,
      };

      if (include_students) {
        const students = r.bus_attendances.map(a => {
          const info = studentInfoMap.get(a.student_id);
          return {
            student_id: a.student_id,
            bus_attendance_id: a.bus_attendance_id,
            status: a.status,
            name: info?.name || '',
            student_code: info?.student_code || '',
            class: info?.class_name || '',
          };
        });
        result.students = students;
      }

      return result;
    });

    return NextResponse.json(routesWithCount);
  } catch (error) {
    console.error('Error fetching transport:', error);
    return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { route_name, description, vehicle_number, driver_id, fare, facilities } = body;

    if (!route_name) {
      return NextResponse.json({ error: 'Route name is required' }, { status: 400 });
    }

    const route = await db.transport.create({
      data: {
        route_name,
        description: description || '',
        vehicle_number: vehicle_number || '',
        driver_id: driver_id ? parseInt(driver_id) : null,
        fare: fare ? parseFloat(fare) : 0,
        facilities: facilities || '',
      },
    });

    return NextResponse.json(route, { status: 201 });
  } catch (error) {
    console.error('Error creating route:', error);
    return NextResponse.json({ error: 'Failed to create route' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Route ID required' }, { status: 400 });

    const body = await request.json();
    const route = await db.transport.update({
      where: { transport_id: parseInt(id) },
      data: {
        route_name: body.route_name,
        description: body.description || '',
        vehicle_number: body.vehicle_number || '',
        driver_id: body.driver_id ? parseInt(body.driver_id) : null,
        fare: body.fare ? parseFloat(body.fare) : 0,
        facilities: body.facilities || '',
      },
    });

    return NextResponse.json(route);
  } catch (error) {
    console.error('Error updating route:', error);
    return NextResponse.json({ error: 'Failed to update route' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await db.bus_attendance.deleteMany({ where: { route_id: parseInt(id) } });
    await db.transport.delete({ where: { transport_id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting route:', error);
    return NextResponse.json({ error: 'Failed to delete route' }, { status: 500 });
  }
}
