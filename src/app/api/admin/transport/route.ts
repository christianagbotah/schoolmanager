import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { route_name: { contains: search } },
        { vehicle_number: { contains: search } },
        { description: { contains: search } },
        { facilities: { contains: search } },
      ];
    }

    const routes = await db.transport.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        bus_attendances: {
          distinct: ['student_id'],
          select: { student_id: true },
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

    const routesWithCount = routes.map(r => ({
      transport_id: r.transport_id,
      route_name: r.route_name,
      description: r.description,
      vehicle_number: r.vehicle_number,
      driver_id: r.driver_id,
      fare: r.fare,
      facilities: r.facilities,
      studentCount: r.bus_attendances.length,
      driver: r.driver_id ? driverMap.get(r.driver_id) || null : null,
    }));

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
