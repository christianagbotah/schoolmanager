import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const parentId = parseInt(session.user.id);
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');

    const children = await db.student.findMany({
      where: { parent_id: parentId },
      select: { student_id: true, name: true, first_name: true, last_name: true, student_code: true },
    });
    const childIds = children.map(c => c.student_id);

    if (childIds.length === 0) {
      return NextResponse.json({ children: [], invoices: [], payments: [] });
    }

    // Invoices
    let invoiceWhere: Record<string, unknown> = {
      student_id: { in: childIds },
      can_delete: { not: 'trash' },
    };
    if (studentId) invoiceWhere.student_id = parseInt(studentId);

    const invoices = await db.invoice.findMany({
      where: invoiceWhere,
      orderBy: { creation_timestamp: 'desc' },
      select: {
        invoice_id: true,
        invoice_code: true,
        title: true,
        description: true,
        amount: true,
        amount_paid: true,
        due: true,
        status: true,
        year: true,
        term: true,
        creation_timestamp: true,
        payment_timestamp: true,
        student_id: true,
      },
    });

    // Payments
    let paymentWhere: Record<string, unknown> = { student_id: { in: childIds } };
    if (studentId) paymentWhere.student_id = parseInt(studentId);

    const payments = await db.payment.findMany({
      where: paymentWhere,
      orderBy: { timestamp: 'desc' },
      select: {
        payment_id: true,
        receipt_code: true,
        invoice_code: true,
        title: true,
        amount: true,
        due: true,
        payment_method: true,
        payment_type: true,
        timestamp: true,
        approval_status: true,
        student_id: true,
      },
    });

    // Currency
    const currency = await db.settings.findFirst({ where: { type: 'currency' } });

    // MoMo settings
    const [moName, moNumber] = await Promise.all([
      db.settings.findFirst({ where: { type: 'mo_account_name' } }),
      db.settings.findFirst({ where: { type: 'mo_account_number' } }),
    ]);

    return NextResponse.json({
      children,
      invoices,
      payments,
      currency: currency?.description || 'GHS',
      moAccountName: moName?.description || '',
      moAccountNumber: moNumber?.description || '',
    });
  } catch (error) {
    console.error('Parent payments error:', error);
    return NextResponse.json({ error: 'Failed to load payments' }, { status: 500 });
  }
}
