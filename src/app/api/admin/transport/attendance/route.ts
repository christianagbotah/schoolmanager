import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// POST: Assign a student to a route (creates bus_attendance record)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Batch assign (from transport page assign dialog)
    if (body.batch_assign) {
      const { student_ids, route_id, attendance_date, total_fare } = body;
      if (!student_ids?.length || !route_id) {
        return NextResponse.json({ error: 'student_ids and route_id are required' }, { status: 400 });
      }
      const results = [];
      for (const student_id of student_ids) {
        const existing = await db.bus_attendance.findFirst({
          where: { student_id: parseInt(student_id), route_id: parseInt(route_id) },
        });
        if (existing) {
          const updated = await db.bus_attendance.update({
            where: { bus_attendance_id: existing.bus_attendance_id },
            data: {
              attendance_date: attendance_date ? new Date(attendance_date) : new Date(),
              transport_direction: 'morning',
              total_fare: total_fare ? parseFloat(total_fare) : 0,
              status: 'present',
            },
          });
          results.push(updated);
        } else {
          const record = await db.bus_attendance.create({
            data: {
              student_id: parseInt(student_id),
              route_id: parseInt(route_id),
              attendance_date: attendance_date ? new Date(attendance_date) : new Date(),
              transport_direction: 'morning',
              total_fare: total_fare ? parseFloat(total_fare) : 0,
              status: 'present',
            },
          });
          results.push(record);
        }
      }
      return NextResponse.json({ success: true, count: results.length }, { status: 201 });
    }

    // Mark attendance batch (from attendance tab)
    if (body.mark_attendance) {
      const { route_id, date, session, attendance } = body;
      if (!route_id || !date || !attendance) {
        return NextResponse.json({ error: 'route_id, date and attendance are required' }, { status: 400 });
      }
      let count = 0;
      for (const [studentId, status] of Object.entries(attendance)) {
        const student_id = parseInt(studentId);
        const existing = await db.bus_attendance.findFirst({
          where: { student_id, route_id: parseInt(route_id) },
        });
        if (existing) {
          await db.bus_attendance.update({
            where: { bus_attendance_id: existing.bus_attendance_id },
            data: {
              attendance_date: new Date(date),
              transport_direction: session || 'morning',
              status: status as string,
            },
          });
        } else {
          await db.bus_attendance.create({
            data: {
              student_id,
              route_id: parseInt(route_id),
              attendance_date: new Date(date),
              transport_direction: session || 'morning',
              status: status as string,
            },
          });
        }
        count++;
      }
      return NextResponse.json({ success: true, count });
    }

    // Reassign student to a new route
    if (body.reassign) {
      const { student_id, from_route_id, to_route_id } = body;
      if (!student_id || !from_route_id || !to_route_id) {
        return NextResponse.json({ error: 'student_id, from_route_id and to_route_id required' }, { status: 400 });
      }
      // Find all attendance records for this student on the old route and update to new route
      const updated = await db.bus_attendance.updateMany({
        where: { student_id: parseInt(student_id), route_id: parseInt(from_route_id) },
        data: { route_id: parseInt(to_route_id) },
      });
      return NextResponse.json({ success: true, count: updated.count });
    }

    // Single assign (backward compatible)
    const { student_id, route_id, attendance_date, transport_direction, total_fare } = body;
    if (!student_id || !route_id) {
      return NextResponse.json({ error: 'student_id and route_id are required' }, { status: 400 });
    }
    const existing = await db.bus_attendance.findFirst({
      where: { student_id: parseInt(student_id), route_id: parseInt(route_id) },
    });
    if (existing) {
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

// GET: Fetch bus_attendance records (optionally filter by route)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('route_id');
    const action = searchParams.get('action');

    // Get students for a specific route (for students tab)
    if (action === 'students' && routeId) {
      const records = await db.bus_attendance.findMany({
        where: { route_id: parseInt(routeId) },
        distinct: ['student_id'],
        select: {
          bus_attendance_id: true,
          student_id: true,
          student: {
            select: {
              student_id: true,
              name: true,
              student_code: true,
              phone: true,
            },
          },
        },
        orderBy: { bus_attendance_id: 'desc' },
      });

      // Enrich with class info
      const studentIds = records.map(r => r.student_id);
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

      // Get guardian phone
      const studentsWithParent = studentIds.length > 0
        ? await db.student.findMany({
            where: { student_id: { in: studentIds } },
            select: { student_id: true, parent: { select: { phone: true, name: true } } },
          })
        : [];
      const parentMap = new Map(studentsWithParent.map(s => [s.student_id, s.parent]));

      const students = records.map(r => {
        const cls = enrollMap.get(r.student_id);
        const parent = parentMap.get(r.student_id);
        return {
          bus_attendance_id: r.bus_attendance_id,
          student_id: r.student_id,
          name: r.student.name,
          student_code: r.student.student_code,
          phone: r.student.phone,
          class: cls ? `${cls.name} ${cls.name_numeric}` : '',
          guardian_phone: parent?.phone || '',
        };
      });

      return NextResponse.json(students);
    }

    // Get attendance for a route on a specific date (for attendance tab)
    if (action === 'attendance' && routeId) {
      const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
      const session = searchParams.get('session') || 'both';

      const records = await db.bus_attendance.findMany({
        where: { route_id: parseInt(routeId) },
        distinct: ['student_id'],
        select: {
          bus_attendance_id: true,
          student_id: true,
          status: true,
          attendance_date: true,
          transport_direction: true,
          student: {
            select: {
              student_id: true,
              name: true,
              student_code: true,
            },
          },
        },
        orderBy: { bus_attendance_id: 'desc' },
      });

      // Filter by session if needed
      const filtered = session === 'both'
        ? records
        : records.filter(r => r.transport_direction === session);

      // Enrich with class info
      const studentIds = filtered.map(r => r.student_id);
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

      const students = filtered.map(r => {
        const cls = enrollMap.get(r.student_id);
        return {
          bus_attendance_id: r.bus_attendance_id,
          student_id: r.student_id,
          name: r.student.name,
          student_code: r.student.student_code,
          class: cls ? `${cls.name} ${cls.name_numeric}` : '',
          status: r.status || 'present',
        };
      });

      return NextResponse.json(students);
    }

    // Default: return all records
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

// DELETE: Remove a student from a route (unassign)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const student_id = searchParams.get('student_id');
    const route_id = searchParams.get('route_id');

    // Unassign a student from a specific route (delete all their attendance records on that route)
    if (student_id && route_id) {
      const deleted = await db.bus_attendance.deleteMany({
        where: { student_id: parseInt(student_id), route_id: parseInt(route_id) },
      });
      return NextResponse.json({ success: true, count: deleted.count });
    }

    // Delete single record by id
    if (!id) return NextResponse.json({ error: 'Record ID required' }, { status: 400 });
    await db.bus_attendance.delete({ where: { bus_attendance_id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing student from transport:', error);
    return NextResponse.json({ error: 'Failed to remove student' }, { status: 500 });
  }
}
