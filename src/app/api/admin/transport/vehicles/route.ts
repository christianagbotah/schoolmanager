import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { vehicle_name: { contains: search } },
        { plate_number: { contains: search } },
      ];
    }

    const vehicles = await db.transport_vehicle.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        driver: {
          select: { driver_id: true, name: true },
        },
      },
      orderBy: { vehicle_id: 'desc' },
    });

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vehicle_name, plate_number, vehicle_type, capacity, driver_id, status } = body;

    if (!vehicle_name || !plate_number) {
      return NextResponse.json({ error: 'Vehicle name and plate number are required' }, { status: 400 });
    }

    // If assigning a driver, clear any previous vehicle assignment for that driver
    if (driver_id) {
      await db.transport_vehicle.updateMany({
        where: { driver_id: parseInt(driver_id) },
        data: { driver_id: null },
      });
    }

    const vehicle = await db.transport_vehicle.create({
      data: {
        vehicle_name,
        plate_number,
        vehicle_type: vehicle_type || 'Bus',
        capacity: capacity ? parseInt(capacity) : 0,
        driver_id: driver_id ? parseInt(driver_id) : null,
        status: status || 'Active',
      },
      include: {
        driver: {
          select: { driver_id: true, name: true },
        },
      },
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Vehicle ID required' }, { status: 400 });

    const body = await request.json();
    const { vehicle_name, plate_number, vehicle_type, capacity, driver_id, status } = body;

    // If assigning a driver, clear any previous vehicle assignment for that driver
    if (driver_id) {
      await db.transport_vehicle.updateMany({
        where: {
          driver_id: parseInt(driver_id),
          vehicle_id: { not: parseInt(id) },
        },
        data: { driver_id: null },
      });
    }

    const vehicle = await db.transport_vehicle.update({
      where: { vehicle_id: parseInt(id) },
      data: {
        vehicle_name,
        plate_number,
        vehicle_type: vehicle_type || 'Bus',
        capacity: capacity ? parseInt(capacity) : 0,
        driver_id: driver_id ? parseInt(driver_id) : null,
        status: status || 'Active',
      },
      include: {
        driver: {
          select: { driver_id: true, name: true },
        },
      },
    });

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Vehicle ID required' }, { status: 400 });

    // Clear driver_id reference from the driver model if linked
    await db.driver.updateMany({
      where: { vehicle_id: parseInt(id) },
      data: { vehicle_id: null },
    });

    await db.transport_vehicle.delete({ where: { vehicle_id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return NextResponse.json({ error: 'Failed to delete vehicle' }, { status: 500 });
  }
}
