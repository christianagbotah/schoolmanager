import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/reports/student-accounts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const sectionId = searchParams.get('sectionId');
    const year = searchParams.get('year');
    const term = searchParams.get('term');
    const paymentStatus = searchParams.get('paymentStatus') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause for enrollments (to find active students in classes)
    const enrollWhere: Record<string, unknown> = { mute: 0 };
    if (classId) enrollWhere.class_id = parseInt(classId);
    if (sectionId) enrollWhere.section_id = parseInt(sectionId);
    if (year) enrollWhere.year = year;
    if (term) enrollWhere.term = term;

    // Fetch students with their enrollments, invoices, and payments
    const students = await db.student.findMany({
      where: {
        active_status: 1,
        mute: 0,
        ...(search && {
          OR: [
            { name: { contains: search } },
            { student_code: { contains: search } },
            { first_name: { contains: search } },
            { last_name: { contains: search } },
          ],
        }),
        ...(Object.keys(enrollWhere).length > 1
          ? {
              enrolls: {
                some: enrollWhere as Record<string, unknown>,
              },
            }
          : {}),
      },
      include: {
        enrolls: {
          where: enrollWhere,
          include: {
            class: { select: { class_id: true, name: true } },
            section: { select: { section_id: true, name: true } },
          },
          take: 1,
          orderBy: { year: 'desc' },
        },
        invoices: {
          where: {
            ...(year && { year }),
            ...(term && { term }),
            mute: 0,
          },
          select: {
            invoice_id: true,
            invoice_code: true,
            title: true,
            amount: true,
            amount_paid: true,
            due: true,
            discount: true,
            status: true,
            year: true,
            term: true,
            creation_timestamp: true,
            payment_timestamp: true,
          },
        },
        payments: {
          where: {
            ...(year && { year }),
            ...(term && { term }),
          },
          select: {
            payment_id: true,
            payment_code: true,
            receipt_code: true,
            title: true,
            amount: true,
            payment_method: true,
            timestamp: true,
            year: true,
            term: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Process each student's financial data
    const processedStudents = students.map((student) => {
      const enrollment = student.enrolls[0];
      const totalBilled = student.invoices.reduce((sum, inv) => sum + inv.amount, 0);
      const totalPaid = student.payments.reduce((sum, p) => sum + p.amount, 0);
      const balance = totalBilled - totalPaid;

      // Determine payment status
      let status = 'unpaid';
      if (totalBilled <= 0) {
        status = 'no_fees';
      } else if (Math.abs(balance) < 0.01) {
        status = 'paid';
      } else if (totalPaid > 0) {
        status = 'partial';
      } else {
        status = 'unpaid';
      }

      // Find last payment date
      const lastPayment = student.payments.length > 0
        ? student.payments.reduce((latest, p) => {
            if (!latest || !p.timestamp) return latest;
            if (!latest.timestamp) return p;
            return p.timestamp > latest.timestamp ? p : latest;
          }, student.payments[0])
        : null;

      return {
        student_id: student.student_id,
        student_code: student.student_code,
        name: student.name,
        class_name: enrollment?.class?.name || 'N/A',
        section_name: enrollment?.section?.name || 'N/A',
        year: enrollment?.year || year || 'N/A',
        term: enrollment?.term || term || 'N/A',
        total_billed: totalBilled,
        total_paid: totalPaid,
        balance,
        payment_status: status,
        invoice_count: student.invoices.length,
        payment_count: student.payments.length,
        last_payment_date: lastPayment?.timestamp ? lastPayment.timestamp.toISOString() : null,
      };
    });

    // Filter by payment status
    let filtered = processedStudents;
    if (paymentStatus === 'paid') {
      filtered = filtered.filter((s) => s.payment_status === 'paid');
    } else if (paymentStatus === 'partial') {
      filtered = filtered.filter((s) => s.payment_status === 'partial');
    } else if (paymentStatus === 'unpaid') {
      filtered = filtered.filter(
        (s) => s.payment_status === 'unpaid' || s.payment_status === 'no_fees'
      );
    }

    // Calculate summary statistics
    const totalStudents = filtered.length;
    const totalBilled = filtered.reduce((sum, s) => sum + s.total_billed, 0);
    const totalCollected = filtered.reduce((sum, s) => sum + s.total_paid, 0);
    const totalOutstanding = filtered.reduce((sum, s) => sum + s.balance, 0);
    const paidCount = filtered.filter((s) => s.payment_status === 'paid').length;
    const partialCount = filtered.filter((s) => s.payment_status === 'partial').length;
    const unpaidCount = filtered.filter((s) => s.payment_status === 'unpaid').length;

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedItems = filtered.slice(startIndex, startIndex + limit);

    // Fetch classes and sections for filters
    const classes = await db.school_class.findMany({
      select: { class_id: true, name: true },
      orderBy: { name: 'asc' },
    });

    const sections = await db.section.findMany({
      select: { section_id: true, name: true },
      orderBy: { name: 'asc' },
    });

    // Fetch distinct years from enrollments
    const yearsResult = await db.enroll.findMany({
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'desc' },
    });
    const years = yearsResult.map((r) => r.year).filter(Boolean);

    // Fetch distinct terms
    const termsResult = await db.terms.findMany({
      select: { term_id: true, name: true },
    });

    return NextResponse.json({
      students: paginatedItems,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit),
      },
      summary: {
        total_students: totalStudents,
        total_billed: totalBilled,
        total_collected: totalCollected,
        total_outstanding: totalOutstanding,
        paid_count: paidCount,
        partial_count: partialCount,
        unpaid_count: unpaidCount,
      },
      filters: {
        classes,
        sections,
        years,
        terms: termsResult,
      },
    });
  } catch (error) {
    console.error('Error generating student account report:', error);
    return NextResponse.json(
      { error: 'Failed to generate student account report' },
      { status: 500 }
    );
  }
}
