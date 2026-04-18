import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch fee structures (billing configurations)
    const feeStructures = await db.fee_structures.findMany({
      include: {
        class: {
          select: { class_id: true, name: true, name_numeric: true },
        },
      },
      orderBy: { fee_structure_id: 'desc' },
    });

    // Fetch classes for reference
    const classes = await db.school_class.findMany({
      select: { class_id: true, name: true, name_numeric: true },
      orderBy: { name_numeric: 'asc' },
    });

    // Recent billing activity (invoices created in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentInvoices = await db.invoice.findMany({
      where: {
        creation_timestamp: { gte: thirtyDaysAgo },
        mute: 0,
      },
      include: {
        student: { select: { name: true, student_code: true } },
        class: { select: { name: true } },
      },
      orderBy: { creation_timestamp: 'desc' },
      take: 20,
    });

    // Fetch recent billing history
    const billingHistory = await db.billing_history.findMany({
      include: {
        student: { select: { name: true, student_code: true } },
      },
      orderBy: { billing_date: 'desc' },
      take: 50,
    });

    // Summary stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [pendingInvoices, monthInvoices, totalBilled, totalCollected] = await Promise.all([
      db.invoice.count({ where: { status: { in: ['unpaid', 'partial'] }, mute: 0 } }),
      db.invoice.count({
        where: { creation_timestamp: { gte: startOfMonth }, mute: 0 },
      }),
      db.invoice.aggregate({ _sum: { amount: true }, where: { mute: 0 } }),
      db.invoice.aggregate({ _sum: { amount_paid: true }, where: { mute: 0 } }),
    ]);

    const totalBilledAmount = totalBilled._sum.amount || 0;
    const totalCollectedAmount = totalCollected._sum.amount_paid || 0;
    const collectionRate = totalBilledAmount > 0 ? (totalCollectedAmount / totalBilledAmount) * 100 : 0;

    return NextResponse.json({
      configurations: feeStructures.map((fs) => ({
        fee_structure_id: fs.fee_structure_id,
        name: fs.name,
        class_id: fs.class_id,
        year: fs.year,
        term: fs.term,
        total_amount: fs.total_amount,
        description: fs.description,
        is_active: fs.is_active,
        status: fs.status,
        installment_count: fs.installment_count,
        created_at: fs.created_at?.toISOString() || '',
        class: fs.class ? { class_id: fs.class.class_id, name: fs.class.name, name_numeric: fs.class.name_numeric } : null,
      })),
      classes,
      recentInvoices: recentInvoices.map((inv) => ({
        invoiceId: inv.invoice_id,
        invoiceCode: inv.invoice_code,
        title: inv.title,
        amount: inv.amount,
        amountPaid: inv.amount_paid,
        status: inv.status,
        createdAt: inv.creation_timestamp?.toISOString() || null,
        studentName: inv.student.name,
        studentCode: inv.student.student_code,
        className: inv.class?.name || '',
      })),
      billingHistory: billingHistory.map((bh) => ({
        billing_history_id: bh.billing_history_id,
        student_id: bh.student_id,
        invoice_id: bh.invoice_id,
        amount: bh.amount,
        billing_type: bh.billing_type,
        billing_date: bh.billing_date?.toISOString() || null,
        status: bh.status,
        reference: bh.reference,
        student: bh.student ? { name: bh.student.name, student_code: bh.student.student_code } : undefined,
      })),
      summary: {
        pendingInvoices,
        generatedThisMonth: monthInvoices,
        totalBilled: totalBilledAmount,
        activeConfigurations: feeStructures.filter((fs) => fs.is_active === 1).length,
        collectionRate,
      },
    });
  } catch (error) {
    console.error('Error fetching auto-billing data:', error);
    return NextResponse.json({ error: 'Failed to fetch auto-billing data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { feeStructureId, classId, year, term, dueDate, description, generatePreview } = body;

    if (!feeStructureId || !classId) {
      return NextResponse.json({ error: 'feeStructureId and classId are required' }, { status: 400 });
    }

    // Get the fee structure
    const feeStructure = await db.fee_structures.findUnique({
      where: { fee_structure_id: parseInt(feeStructureId) },
    });

    if (!feeStructure) {
      return NextResponse.json({ error: 'Fee structure not found' }, { status: 404 });
    }

    // Get enrolled students for the class
    const enrolls = await db.enroll.findMany({
      where: {
        class_id: parseInt(classId),
        ...(term ? { term } : {}),
        ...(year ? { year } : {}),
        mute: 0,
      },
      select: { student_id: true },
      distinct: ['student_id'],
    });

    const studentIds = enrolls.map((e) => e.student_id);

    if (studentIds.length === 0) {
      return NextResponse.json({ error: 'No students enrolled in this class' }, { status: 400 });
    }

    // Get class info
    const classInfo = await db.school_class.findUnique({
      where: { class_id: parseInt(classId) },
      select: { name: true, name_numeric: true },
    });

    // Preview mode: return invoice data without creating
    if (generatePreview) {
      const students = await db.student.findMany({
        where: { student_id: { in: studentIds }, active_status: 1 },
        select: { student_id: true, name: true, student_code: true },
      });

      const previewInvoices = students.map((s) => ({
        studentId: s.student_id,
        name: s.name,
        studentCode: s.student_code,
        title: description || feeStructure.name,
        amount: feeStructure.total_amount,
        dueDate: dueDate || null,
        year: year || feeStructure.year,
        term: term || feeStructure.term,
        className: classInfo?.name || '',
      }));

      return NextResponse.json({
        preview: previewInvoices,
        totalAmount: feeStructure.total_amount * previewInvoices.length,
        studentCount: previewInvoices.length,
      });
    }

    // Actual generation is handled by the /generate endpoint
    // This endpoint now only handles preview
    return NextResponse.json({ error: 'Use /generate endpoint for actual invoice generation' }, { status: 400 });
  } catch (error) {
    console.error('Error previewing invoices:', error);
    return NextResponse.json({ error: 'Failed to preview invoices' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { feeStructureId, isActive, name, totalAmount, classId, year, term, description, installmentCount } = body;

    if (!feeStructureId) {
      return NextResponse.json({ error: 'feeStructureId is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (isActive !== undefined) updateData.is_active = isActive ? 1 : 0;
    if (name !== undefined) updateData.name = name;
    if (totalAmount !== undefined) updateData.total_amount = parseFloat(totalAmount);
    if (classId !== undefined) updateData.class_id = classId ? parseInt(classId) : null;
    if (year !== undefined) updateData.year = year;
    if (term !== undefined) updateData.term = term;
    if (description !== undefined) updateData.description = description;
    if (installmentCount !== undefined) updateData.installment_count = parseInt(installmentCount);

    const updated = await db.fee_structures.update({
      where: { fee_structure_id: parseInt(feeStructureId) },
      data: updateData,
    });

    return NextResponse.json({
      feeStructure: updated,
      message: 'Auto-billing configuration updated successfully',
    });
  } catch (error) {
    console.error('Error updating auto-billing:', error);
    return NextResponse.json({ error: 'Failed to update auto-billing configuration' }, { status: 500 });
  }
}
