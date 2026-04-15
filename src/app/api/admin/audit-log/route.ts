import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '15', 10)));
    const search = searchParams.get('search') || '';
    const userType = searchParams.get('userType') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    // Build the WHERE clause
    const where: Prisma.audit_trailWhereInput = {};

    if (search) {
      where.OR = [
        { action: { contains: search } },
        { table_name: { contains: search } },
      ];
    }

    if (userType) {
      where.user_type = userType;
    }

    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) {
        where.created_at.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        where.created_at.lte = to;
      }
    }

    // Get total count and records in parallel
    const [total, records] = await Promise.all([
      db.audit_trail.count({ where }),
      db.audit_trail.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    // Resolve user names from their respective tables based on user_type
    const userIdsByType: Record<string, number[]> = {};

    for (const record of records) {
      if (record.user_id != null) {
        if (!userIdsByType[record.user_type]) {
          userIdsByType[record.user_type] = [];
        }
        if (!userIdsByType[record.user_type].includes(record.user_id)) {
          userIdsByType[record.user_type].push(record.user_id);
        }
      }
    }

    // Fetch user names for each user type
    const userNames: Record<string, Record<number, string>> = {};

    if (userIdsByType['admin']?.length) {
      const admins = await db.admin.findMany({
        where: { admin_id: { in: userIdsByType['admin'] } },
        select: { admin_id: true, name: true },
      });
      userNames['admin'] = Object.fromEntries(
        admins.map((a) => [a.admin_id, a.name])
      );
    }

    if (userIdsByType['teacher']?.length) {
      const teachers = await db.teacher.findMany({
        where: { teacher_id: { in: userIdsByType['teacher'] } },
        select: { teacher_id: true, name: true },
      });
      userNames['teacher'] = Object.fromEntries(
        teachers.map((t) => [t.teacher_id, t.name])
      );
    }

    if (userIdsByType['parent']?.length) {
      const parents = await db.parent.findMany({
        where: { parent_id: { in: userIdsByType['parent'] } },
        select: { parent_id: true, name: true },
      });
      userNames['parent'] = Object.fromEntries(
        parents.map((p) => [p.parent_id, p.name])
      );
    }

    if (userIdsByType['student']?.length) {
      const students = await db.student.findMany({
        where: { student_id: { in: userIdsByType['student'] } },
        select: { student_id: true, name: true },
      });
      userNames['student'] = Object.fromEntries(
        students.map((s) => [s.student_id, s.name])
      );
    }

    if (userIdsByType['accountant']?.length) {
      const accountants = await db.accountant.findMany({
        where: { accountant_id: { in: userIdsByType['accountant'] } },
        select: { accountant_id: true, name: true },
      });
      userNames['accountant'] = Object.fromEntries(
        accountants.map((a) => [a.accountant_id, a.name])
      );
    }

    if (userIdsByType['librarian']?.length) {
      const librarians = await db.librarian.findMany({
        where: { librarian_id: { in: userIdsByType['librarian'] } },
        select: { librarian_id: true, name: true },
      });
      userNames['librarian'] = Object.fromEntries(
        librarians.map((l) => [l.librarian_id, l.name])
      );
    }

    // Attach resolved user names to each record
    const logsWithUser = records.map((record) => {
      const userName =
        record.user_id != null && userNames[record.user_type]
          ? userNames[record.user_type][record.user_id] ?? null
          : null;

      return {
        audit_trail_id: record.audit_trail_id,
        user_id: record.user_id,
        user_type: record.user_type,
        user_name: userName,
        action: record.action,
        table_name: record.table_name,
        record_id: record.record_id,
        old_values: record.old_values || null,
        new_values: record.new_values || null,
        ip_address: record.ip_address || null,
        user_agent: record.user_agent || null,
        created_at: record.created_at,
      };
    });

    return NextResponse.json({
      logs: logsWithUser,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
