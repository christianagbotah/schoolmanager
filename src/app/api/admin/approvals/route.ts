import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/approvals - Get pending approval requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const type = searchParams.get('type') || '';

    const where: any = {};
    if (status && status !== 'all') where.status = status;
    if (type) where.request_type = type;

    const requests = await db.approval_request.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 100,
    });

    const counts = await db.approval_request.groupBy({
      by: ['status'],
      _count: true,
    });

    const statusCounts: Record<string, number> = {};
    counts.forEach((c: any) => { statusCounts[c.status] = c._count; });

    return NextResponse.json({ requests, statusCounts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/approvals - Create, approve, or reject a request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, request_type, reference_id, reference_code, title, description, requested_by, reviewed_by, review_reason } = body;

    if (action === 'create') {
      if (!title || !request_type) {
        return NextResponse.json({ error: 'title and request_type required' }, { status: 400 });
      }
      const req = await db.approval_request.create({
        data: {
          request_type,
          reference_id: reference_id || null,
          reference_code: reference_code || '',
          title,
          description: description || '',
          requested_by: requested_by || 'Admin',
          status: 'pending',
        },
      });
      return NextResponse.json({ status: 'success', message: 'Approval request created', request: req });
    }

    if (action === 'approve' || action === 'reject') {
      if (!id) {
        return NextResponse.json({ error: 'id required' }, { status: 400 });
      }
      const req = await db.approval_request.update({
        where: { id },
        data: {
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewed_by: reviewed_by || 'Admin',
          review_reason: review_reason || '',
          reviewed_at: new Date(),
        },
      });
      return NextResponse.json({
        status: 'success',
        message: `Request ${action === 'approve' ? 'approved' : 'rejected'}`,
        request: req,
      });
    }

    return NextResponse.json({ error: 'Invalid action. Use create, approve, or reject.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
