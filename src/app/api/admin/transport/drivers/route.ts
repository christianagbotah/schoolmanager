import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { license_number: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const drivers = await db.driver.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        vehicles: {
          select: { vehicle_id: true, vehicle_name: true, plate_number: true },
          take: 1,
        },
      },
      orderBy: { driver_id: 'desc' },
    });

    const driversWithVehicle = drivers.map(d => ({
      ...d,
      assignedVehicle: d.vehicles[0] || null,
      vehicles: undefined,
    }));

    return NextResponse.json(driversWithVehicle);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, license_number, license_expiry, vehicle_id, status } = body;

    if (!name || !license_number) {
      return NextResponse.json({ error: 'Driver name and license number are required' }, { status: 400 });
    }

    // If assigning a vehicle, clear driver_id from that vehicle
    if (vehicle_id) {
      await db.transport_vehicle.updateMany({
        where: { vehicle_id: parseInt(vehicle_id) },
        data: { driver_id: null },
      });
    }

    const driver = await db.driver.create({
      data: {
        name,
        phone: phone || '',
        email: email || '',
        license_number,
        license_expiry: license_expiry ? new Date(license_expiry) : null,
        vehicle_id: vehicle_id ? parseInt(vehicle_id) : null,
        status: status || 'Active',
      },
    });

    // If assigning a vehicle, set the driver_id on the vehicle
    if (vehicle_id) {
      await db.transport_vehicle.update({
        where: { vehicle_id: parseInt(vehicle_id) },
        data: { driver_id: driver.driver_id },
      });
    }

    return NextResponse.json(driver, { status: 201 });
  } catch (error) {
    console.error('Error creating driver:', error);
    return NextResponse.json({ error: 'Failed to create driver' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Driver ID required' }, { status: 400 });

    const body = await request.json();
    const { name, phone, email, license_number, license_expiry, vehicle_id, status } = body;

    // Get current driver to check for vehicle changes
    const currentDriver = await db.driver.findUnique({ where: { driver_id: parseInt(id) } });
    const oldVehicleId = currentDriver?.vehicle_id;

    // If changing vehicle assignment, clear old vehicle's driver_id
    if (oldVehicleId && oldVehicleId !== (vehicle_id ? parseInt(vehicle_id) : null)) {
      await db.transport_vehicle.update({
        where: { vehicle_id: oldVehicleId },
        data: { driver_id: null },
      });
    }

    // If assigning a new vehicle, clear that vehicle's current driver_id
    if (vehicle_id && vehicle_id !== oldVehicleId?.toString()) {
      await db.transport_vehicle.updateMany({
        where: { vehicle_id: parseInt(vehicle_id) },
        data: { driver_id: null },
      });
    }

    const driver = await db.driver.update({
      where: { driver_id: parseInt(id) },
      data: {
        name,
        phone: phone || '',
        email: email || '',
        license_number,
        license_expiry: license_expiry ? new Date(license_expiry) : null,
        vehicle_id: vehicle_id ? parseInt(vehicle_id) : null,
        status: status || 'Active',
      },
    });

    // Set driver_id on newly assigned vehicle
    if (vehicle_id) {
      await db.transport_vehicle.update({
        where: { vehicle_id: parseInt(vehicle_id) },
        data: { driver_id: parseInt(id) },
      });
    }

    return NextResponse.json(driver);
  } catch (error) {
    console.error('Error updating driver:', error);
    return NextResponse.json({ error: 'Failed to update driver' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Driver ID required' }, { status: 400 });

    const driver = await db.driver.findUnique({ where: { driver_id: parseInt(id) } });

    // Clear vehicle driver references
    if (driver?.vehicle_id) {
      await db.transport_vehicle.update({
        where: { vehicle_id: driver.vehicle_id },
        data: { driver_id: null },
      });
    }
    await db.transport_vehicle.updateMany({
      where: { driver_id: parseInt(id) },
      data: { driver_id: null },
    });

    await db.driver.delete({ where: { driver_id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting driver:', error);
    return NextResponse.json({ error: 'Failed to delete driver' }, { status: 500 });
  }
}
