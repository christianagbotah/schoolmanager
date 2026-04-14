import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { classId, items, year, term } = body;

    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }

    const classInfo = await db.school_class.findUnique({
      where: { class_id: parseInt(classId) },
    });

    if (!classInfo) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Get enrolled students
    const enrolls = await db.enroll.findMany({
      where: { class_id: parseInt(classId), year, term },
      include: { student: { select: { student_id: true, active_status: true } } },
    });

    if (enrolls.length === 0) {
      return NextResponse.json({ error: 'No students enrolled in this class for this term' }, { status: 400 });
    }

    const activeStudents = enrolls.filter(e => e.student.active_status === 1);
    const totalAmount = items.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0);

    const results = [];
    for (const enroll of activeStudents) {
      const invoiceCode = `INV-${new Date().getFullYear().toString().slice(2)}-${String(Date.now()).slice(-4)}-${String(enroll.student_id).slice(-3)}`;
      const invoice = await db.invoice.create({
        data: {
          student_id: enroll.student_id,
          title: `${term} Fees - ${year}`,
          description: items.map((i: { title: string }) => i.title).join(', '),
          amount: totalAmount,
          amount_paid: 0,
          due: totalAmount,
          discount: 0,
          creation_timestamp: new Date(),
          status: 'unpaid',
          year,
          term,
          class_id: parseInt(classId),
          invoice_code: invoiceCode,
          class_name: classInfo.name,
        },
      });
      results.push(invoice);
    }

    return NextResponse.json({ invoices: results, message: `${results.length} invoices created for ${classInfo.name}` });
  } catch (error) {
    console.error('Error mass creating invoices:', error);
    return NextResponse.json({ error: 'Failed to create invoices' }, { status: 500 });
  }
}
