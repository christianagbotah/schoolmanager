import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/reports/student-accounts/statement
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const year = searchParams.get('year') || '';
    const term = searchParams.get('term') || '';

    if (!studentId) {
      return NextResponse.json(
        { error: 'studentId is required' },
        { status: 400 }
      );
    }

    const studentIdNum = parseInt(studentId);

    // Fetch student with enrollment info
    const student = await db.student.findUnique({
      where: { student_id: studentIdNum },
      include: {
        parent: {
          select: {
            parent_id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        enrolls: {
          where: {
            ...(year && { year }),
            mute: 0,
          },
          include: {
            class: { select: { class_id: true, name: true } },
            section: { select: { section_id: true, name: true } },
          },
          orderBy: { year: 'desc' },
          take: 1,
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const enrollment = student.enrolls[0];

    // Fetch all invoices for the student
    const invoices = await db.invoice.findMany({
      where: {
        student_id: studentIdNum,
        ...(year && { year }),
        ...(term && { term }),
        mute: 0,
      },
      include: {
        payments: {
          select: {
            payment_id: true,
            payment_code: true,
            receipt_code: true,
            title: true,
            amount: true,
            payment_method: true,
            timestamp: true,
          },
          orderBy: { timestamp: 'desc' },
        },
      },
      orderBy: { creation_timestamp: 'asc' },
    });

    // Fetch all payments for the student (including standalone)
    const payments = await db.payment.findMany({
      where: {
        student_id: studentIdNum,
        ...(year && { year }),
        ...(term && { term }),
      },
      select: {
        payment_id: true,
        payment_code: true,
        receipt_code: true,
        invoice_code: true,
        title: true,
        amount: true,
        due: true,
        payment_method: true,
        timestamp: true,
        approval_status: true,
        invoice_id: true,
      },
      orderBy: { timestamp: 'asc' },
    });

    // Fetch receipts for the student
    const receipts = await db.receipts.findMany({
      where: {
        student_id: studentIdNum,
      },
      select: {
        receipt_id: true,
        receipt_number: true,
        invoice_code: true,
        amount: true,
        payment_method: true,
        generated_at: true,
      },
      orderBy: { generated_at: 'desc' },
    });

    // Calculate totals
    const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalDiscount = invoices.reduce((sum, inv) => sum + inv.discount, 0);
    const balance = totalBilled - totalPaid;
    const paidInvoiceCount = invoices.filter((inv) => inv.status === 'paid').length;
    const partialInvoiceCount = invoices.filter((inv) => inv.status === 'partial').length;
    const unpaidInvoiceCount = invoices.filter(
      (inv) => inv.status === 'unpaid' || inv.status === 'overdue'
    ).length;

    // Build fee schedule (invoices as fee items)
    const feeSchedule = invoices.map((inv) => ({
      invoice_id: inv.invoice_id,
      invoice_code: inv.invoice_code || `INV-${String(inv.invoice_id).padStart(4, '0')}`,
      title: inv.title || inv.description || 'School Fees',
      amount: inv.amount,
      discount: inv.discount,
      paid: inv.amount_paid,
      balance: inv.due,
      status: inv.status || (inv.due <= 0 ? 'paid' : 'unpaid'),
      created_at: inv.creation_timestamp ? inv.creation_timestamp.toISOString() : null,
      due_date: inv.payment_timestamp ? inv.payment_timestamp.toISOString() : null,
      year: inv.year,
      term: inv.term,
      payment_count: inv.payments.length,
    }));

    // Build payment history with running balance
    // Sort all invoices and payments chronologically
    const allTransactions: {
      type: 'invoice' | 'payment';
      date: string | null;
      amount: number;
      description: string;
      invoice_code: string;
      payment_method: string;
      receipt_no: string;
    }[] = [];

    // Add invoices (billed amounts)
    for (const inv of invoices) {
      allTransactions.push({
        type: 'invoice',
        date: inv.creation_timestamp ? inv.creation_timestamp.toISOString() : null,
        amount: inv.amount,
        description: inv.title || inv.description || 'School Fees',
        invoice_code: inv.invoice_code || `INV-${String(inv.invoice_id).padStart(4, '0')}`,
        payment_method: '',
        receipt_no: '',
      });
    }

    // Add payments
    for (const p of payments) {
      const receipt = receipts.find(
        (r) => r.payment_id === p.payment_id
      );
      allTransactions.push({
        type: 'payment',
        date: p.timestamp ? p.timestamp.toISOString() : null,
        amount: p.amount,
        description: p.title || 'Payment',
        invoice_code: p.invoice_code || '',
        payment_method: p.payment_method || '',
        receipt_no: receipt?.receipt_number || p.receipt_code || '',
      });
    }

    // Sort by date
    allTransactions.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    // Calculate running balance
    let runningBalance = 0;
    const paymentHistory = allTransactions.map((t) => {
      if (t.type === 'invoice') {
        runningBalance += t.amount;
      } else {
        runningBalance -= t.amount;
      }
      return {
        ...t,
        running_balance: runningBalance,
      };
    });

    // Get the last payment date
    const lastPayment = payments.length > 0
      ? payments.reduce((latest, p) => {
          if (!latest || !p.timestamp) return latest;
          if (!latest.timestamp) return p;
          return p.timestamp > latest.timestamp ? p : latest;
        }, payments[0])
      : null;

    // Determine overall payment status
    let overallStatus = 'unpaid';
    if (totalBilled <= 0) {
      overallStatus = 'no_fees';
    } else if (Math.abs(balance) < 0.01) {
      overallStatus = 'paid';
    } else if (totalPaid > 0) {
      overallStatus = 'partial';
    }

    return NextResponse.json({
      student: {
        student_id: student.student_id,
        student_code: student.student_code,
        name: student.name,
        first_name: student.first_name,
        last_name: student.last_name,
        sex: student.sex,
        phone: student.phone,
        email: student.email,
        class_name: enrollment?.class?.name || 'N/A',
        section_name: enrollment?.section?.name || 'N/A',
        year: enrollment?.year || year || 'N/A',
        term: enrollment?.term || term || 'N/A',
        admission_date: student.admission_date ? student.admission_date.toISOString() : null,
        parent_name: student.parent?.name || 'N/A',
        parent_phone: student.parent?.phone || 'N/A',
        parent_email: student.parent?.email || 'N/A',
      },
      summary: {
        total_billed: totalBilled,
        total_paid: totalPaid,
        total_discount: totalDiscount,
        balance,
        payment_status: overallStatus,
        invoice_count: invoices.length,
        payment_count: payments.length,
        paid_invoices: paidInvoiceCount,
        partial_invoices: partialInvoiceCount,
        unpaid_invoices: unpaidInvoiceCount,
        last_payment_date: lastPayment?.timestamp ? lastPayment.timestamp.toISOString() : null,
      },
      fee_schedule: feeSchedule,
      payment_history: paymentHistory,
    });
  } catch (error) {
    console.error('Error fetching student statement:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student statement' },
      { status: 500 }
    );
  }
}
