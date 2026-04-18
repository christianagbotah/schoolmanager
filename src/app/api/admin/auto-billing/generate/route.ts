import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      feeStructureId,
      classId,
      year,
      term,
      dueDate,
      description,
      billingDate,
      sectionIds,
      studentIds: overrideStudentIds,
    } = body;

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

    if (feeStructure.is_active !== 1) {
      return NextResponse.json({ error: 'Fee structure is not active' }, { status: 400 });
    }

    const effectiveYear = year || feeStructure.year || '';
    const effectiveTerm = term || feeStructure.term || '';

    // Get enrolled students for the class
    let studentIdsToBill: number[] = [];

    if (overrideStudentIds && overrideStudentIds.length > 0) {
      studentIdsToBill = overrideStudentIds.map((id: number) => id);
    } else {
      const enrollWhere: Record<string, unknown> = {
        class_id: parseInt(classId),
        mute: 0,
      };
      if (effectiveTerm) enrollWhere.term = effectiveTerm;
      if (effectiveYear) enrollWhere.year = effectiveYear;

      const enrolls = await db.enroll.findMany({
        where: enrollWhere,
        select: { student_id: true },
        distinct: ['student_id'],
      });

      studentIdsToBill = enrolls.map((e) => e.student_id);
    }

    if (studentIdsToBill.length === 0) {
      return NextResponse.json({ error: 'No students found to generate invoices for' }, { status: 400 });
    }

    // Get class info
    const classInfo = await db.school_class.findUnique({
      where: { class_id: parseInt(classId) },
      select: { name: true, name_numeric: true },
    });

    // Get active students
    const students = await db.student.findMany({
      where: {
        student_id: { in: studentIdsToBill },
        active_status: 1,
        mute: 0,
      },
      select: {
        student_id: true,
        name: true,
        student_code: true,
        class_id: true,
      },
    });

    if (students.length === 0) {
      return NextResponse.json({ error: 'No active students found' }, { status: 400 });
    }

    // Check for existing pending invoices to avoid duplicates
    const existingInvoices = await db.invoice.findMany({
      where: {
        student_id: { in: students.map((s) => s.student_id) },
        class_id: parseInt(classId),
        title: description || feeStructure.name,
        year: effectiveYear,
        term: effectiveTerm,
        status: { in: ['unpaid', 'partial'] },
      },
      select: { student_id: true },
    });

    const existingStudentIds = new Set(existingInvoices.map((inv) => inv.student_id));

    // Filter out students who already have pending invoices
    const studentsToBill = students.filter((s) => !existingStudentIds.has(s.student_id));

    if (studentsToBill.length === 0) {
      return NextResponse.json({
        message: 'All students already have pending invoices for this period',
        generatedCount: 0,
        skippedCount: students.length,
        totalAmount: 0,
      });
    }

    // Generate invoices
    const batchId = Date.now();
    const invoiceTitle = description || feeStructure.name;
    const now = new Date();

    const invoiceData = studentsToBill.map((s, idx) => ({
      student_id: s.student_id,
      title: invoiceTitle,
      description: `Auto-generated from fee structure: ${feeStructure.name}`,
      amount: feeStructure.total_amount,
      amount_paid: 0,
      due: feeStructure.total_amount,
      discount: 0,
      status: 'unpaid',
      year: effectiveYear,
      term: effectiveTerm,
      class_id: parseInt(classId),
      invoice_code: `INV-${String(batchId).slice(-6)}-${String(idx + 1).padStart(3, '0')}`,
      class_name: classInfo?.name || '',
      creation_timestamp: now,
      mute: 0,
      can_delete: 'yes',
    }));

    const created = await db.invoice.createMany({ data: invoiceData });

    // Create billing history entries
    const billingReference = `BATCH-${String(batchId).slice(-8)}`;
    const billingHistoryData = studentsToBill.map((s) => ({
      student_id: s.student_id,
      amount: feeStructure.total_amount,
      billing_type: 'auto',
      billing_date: billingDate ? new Date(billingDate) : now,
      status: 'completed',
      reference: billingReference,
    }));

    await db.billing_history.createMany({ data: billingHistoryData });

    const totalAmount = feeStructure.total_amount * studentsToBill.length;

    return NextResponse.json({
      message: `Successfully generated ${created.count} invoices`,
      generatedCount: created.count,
      skippedCount: students.length - studentsToBill.length,
      totalAmount,
      feeStructureName: feeStructure.name,
      className: classInfo?.name || '',
      billingReference,
    });
  } catch (error) {
    console.error('Error generating invoices:', error);
    return NextResponse.json({ error: 'Failed to generate invoices' }, { status: 500 });
  }
}
