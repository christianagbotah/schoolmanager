import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/transport/conductor - Stats, routes, search students, today's collections
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const routeId = searchParams.get('route_id') || '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch all transport routes
    const routes = await db.transport.findMany({
      orderBy: { route_name: 'asc' },
    });

    // Get today's stats
    const todayCollections = await db.transport_collection.findMany({
      where: {
        collection_date: { gte: today, lt: tomorrow },
      },
      include: {
        student: { select: { name: true, student_code: true, sex: true } },
        transport: { select: { route_name: true, vehicle_number: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const totalAmount = todayCollections.reduce((s, c) => s + c.amount, 0);
    const cashAmount = todayCollections.filter(c => c.payment_method === 'cash').reduce((s, c) => s + c.amount, 0);
    const momoAmount = todayCollections.filter(c => c.payment_method === 'mobile_money').reduce((s, c) => s + c.amount, 0);
    const morningCount = todayCollections.filter(c => c.direction === 'morning').length;
    const afternoonCount = todayCollections.filter(c => c.direction === 'afternoon').length;
    const uniqueStudents = new Set(todayCollections.map(c => c.student_id)).size;

    const stats = {
      total_collections: todayCollections.length,
      total_amount: totalAmount,
      cash_amount: cashAmount,
      momo_amount: momoAmount,
      morning_count: morningCount,
      afternoon_count: afternoonCount,
      unique_students: uniqueStudents,
    };

    // Search students (optionally filtered by route via bus_attendance)
    if (search) {
      const students = await db.student.findMany({
        where: {
          active_status: 1,
          OR: [
            { name: { contains: search } },
            { student_code: { contains: search } },
          ],
        },
        select: {
          student_id: true,
          name: true,
          student_code: true,
          sex: true,
        },
        orderBy: { name: 'asc' },
        take: 30,
      });

      return NextResponse.json({ stats, routes, students, todayCollections });
    }

    // If filtering by route
    if (routeId) {
      const filteredCollections = todayCollections.filter(c => c.route_id === parseInt(routeId));
      return NextResponse.json({ stats, routes, todayCollections, filteredCollections });
    }

    return NextResponse.json({ stats, routes, todayCollections });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/transport/conductor - Record a collection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      student_id,
      route_id,
      direction = 'morning',
      amount = 0,
      payment_method = 'cash',
      collected_by = 'Conductor',
    } = body;

    if (!student_id) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }

    // Generate collection code
    const count = await db.transport_collection.count();
    const collectionCode = `TC-${String(count + 1).padStart(6, '0')}`;

    // Get student info
    const student = await db.student.findUnique({
      where: { student_id },
      select: { name: true, student_code: true },
    });

    // Get route info
    const routeInfo = route_id
      ? await db.transport.findUnique({
          where: { transport_id: route_id },
          select: { route_name: true, vehicle_number: true },
        })
      : null;

    // Create collection record
    const collection = await db.transport_collection.create({
      data: {
        collection_code: collectionCode,
        student_id,
        route_id: route_id || null,
        direction,
        amount,
        payment_method,
        collected_by,
      },
      include: {
        student: { select: { name: true, student_code: true } },
        transport: { select: { route_name: true, vehicle_number: true } },
      },
    });

    return NextResponse.json({
      status: 'success',
      message: `GH\u20B5 ${amount.toFixed(2)} collected successfully`,
      collection,
      receipt: {
        collection_code: collectionCode,
        student_name: student?.name,
        student_code: student?.student_code,
        route_name: routeInfo?.route_name || 'N/A',
        direction,
        amount,
        method: payment_method,
        collected_by,
        date: new Date().toLocaleDateString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
