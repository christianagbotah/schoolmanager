import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const classId = searchParams.get('classId') || '';
    const status = searchParams.get('status') || '';
    const year = searchParams.get('year') || '';
    const term = searchParams.get('term') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const action = searchParams.get('action') || '';

    // Bill items listing
    if (action === 'bill-items') {
      const items = await db.bill_item.findMany({
        include: { bill_category: { select: { bill_category_id: true, bill_category_name: true } } },
        orderBy: { id: 'asc' },
      });
      return NextResponse.json({ billItems: items });
    }

    // Bill categories listing
    if (action === 'bill-categories') {
      const categories = await db.bill_category.findMany({ orderBy: { bill_category_id: 'asc' } });
      return NextResponse.json({ categories });
    }

    // Stats for dashboard
    if (action === 'stats') {
      const [totalCount, paidCount, unpaidCount, partialCount, overdueCount, totalBilled, totalCollected, totalOutstanding] = await Promise.all([
        db.invoice.count({ where: { can_delete: { not: 'trash' } } }),
        db.invoice.count({ where: { status: 'paid', can_delete: { not: 'trash' } } }),
        db.invoice.count({ where: { status: 'unpaid', can_delete: { not: 'trash' } } }),
        db.invoice.count({ where: { status: 'partial', can_delete: { not: 'trash' } } }),
        db.invoice.count({ where: { status: 'overdue', can_delete: { not: 'trash' } } }),
        db.invoice.aggregate({ where: { can_delete: { not: 'trash' } }, _sum: { amount: true } }),
        db.invoice.aggregate({ where: { can_delete: { not: 'trash' } }, _sum: { amount_paid: true } }),
        db.invoice.aggregate({ where: { can_delete: { not: 'trash' }, due: { gt: 0 } }, _sum: { due: true } }),
      ]);

      return NextResponse.json({
        stats: {
          total: totalCount,
          paid: paidCount,
          unpaid: unpaidCount,
          partial: partialCount,
          overdue: overdueCount,
          totalBilled: totalBilled._sum.amount || 0,
          totalCollected: totalCollected._sum.amount_paid || 0,
          totalOutstanding: totalOutstanding._sum.due || 0,
        },
      });
    }

    // Students who owe (for take payment modal)
    if (action === 'students-owing') {
      const runningYear = searchParams.get('year') || '';
      const runningTerm = searchParams.get('term') || '';

      const studentsOwing = await db.$queryRaw<any[]>`
        SELECT s.student_id, s.name, s.student_code, c.name as class_name, c.name_numeric,
               SUM(i.due) as total_due
        FROM student s
        INNER JOIN enroll e ON s.student_id = e.student_id
        INNER JOIN class c ON e.class_id = c.class_id
        INNER JOIN invoice i ON i.student_id = s.student_id
        WHERE e.year = ${runningYear}
          AND e.term = ${runningTerm}
          AND e.mute = 0
          AND i.due > 0
          AND i.can_delete != 'trash'
        GROUP BY s.student_id
        ORDER BY s.name ASC
      `;
      return NextResponse.json({ students: studentsOwing });
    }

    // Invoice list
    const where: Record<string, unknown> = { can_delete: { not: 'trash' } };

    if (search) {
      where.OR = [
        { invoice_code: { contains: search } },
        { title: { contains: search } },
        { student: { OR: [
          { name: { contains: search } },
          { first_name: { contains: search } },
          { last_name: { contains: search } },
          { student_code: { contains: search } },
        ]}},
      ];
    }
    if (classId) where.class_id = parseInt(classId);
    if (status) where.status = status;
    if (year) where.year = year;
    if (term) where.term = term;

    const [invoices, total, summary] = await Promise.all([
      db.invoice.findMany({
        where,
        include: {
          student: { select: { student_id: true, name: true, first_name: true, last_name: true, student_code: true } },
        },
        orderBy: { creation_timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.invoice.count({ where }),
      db.invoice.aggregate({
        where,
        _sum: { amount: true, amount_paid: true, due: true },
      }),
    ]);

    return NextResponse.json({
      invoices,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      summary: {
        totalBilled: summary._sum.amount || 0,
        totalCollected: summary._sum.amount_paid || 0,
        outstanding: summary._sum.due || 0,
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // Add bill item
    if (action === 'add-bill-item') {
      const { title, amount, description, billCategoryId } = body;
      if (!title || !amount) {
        return NextResponse.json({ error: 'Title and amount are required' }, { status: 400 });
      }
      const item = await db.bill_item.create({
        data: {
          title,
          amount: parseFloat(amount),
          description: description || '',
          bill_category_id: billCategoryId ? parseInt(billCategoryId) : null,
        },
      });
      return NextResponse.json({ billItem: item, message: 'Bill item added successfully' });
    }

    // Update bill item
    if (action === 'update-bill-item') {
      const { id, title, amount, description, billCategoryId } = body;
      if (!id) {
        return NextResponse.json({ error: 'Bill item ID is required' }, { status: 400 });
      }
      const item = await db.bill_item.update({
        where: { id: parseInt(id) },
        data: {
          title: title || undefined,
          amount: amount !== undefined ? parseFloat(amount) : undefined,
          description: description !== undefined ? description : undefined,
          bill_category_id: billCategoryId !== undefined ? (billCategoryId ? parseInt(billCategoryId) : null) : undefined,
        },
      });
      return NextResponse.json({ billItem: item, message: 'Bill item updated successfully' });
    }

    // Delete bill item
    if (action === 'delete-bill-item') {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ error: 'Bill item ID is required' }, { status: 400 });
      }
      // Check if it's a system item (id 8 or 9 in CI3)
      await db.bill_item.delete({ where: { id: parseInt(id) } });
      return NextResponse.json({ message: 'Bill item deleted successfully' });
    }

    // Create single invoice
    if (action === 'create-single') {
      const { studentId, items, date, term, year, classId, className, title } = body;
      if (!studentId) {
        return NextResponse.json({ error: 'Student is required' }, { status: 400 });
      }
      if (!items || items.length === 0) {
        return NextResponse.json({ error: 'At least one billing item is required' }, { status: 400 });
      }

      const totalAmount = items.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0);
      const timestamp = date ? new Date(date) : new Date();
      const invoiceCode = `INV-${year?.replace('-', '') || new Date().getFullYear().toString().slice(2)}-${String(Date.now()).slice(-6)}`;
      const invTitle = title || `${term} Fees - ${year}`;

      // Check for duplicate
      const existing = await db.invoice.findFirst({
        where: { student_id: studentId, year, term, class_id: classId ? parseInt(classId) : null, title: invTitle },
      });
      if (existing) {
        return NextResponse.json({ error: 'An invoice with similar details already exists for this student' }, { status: 400 });
      }

      const invoice = await db.invoice.create({
        data: {
          student_id: studentId,
          title: invTitle,
          description: items.map((i: { title: string }) => i.title).join(', '),
          amount: totalAmount,
          amount_paid: 0,
          due: totalAmount,
          discount: 0,
          creation_timestamp: timestamp,
          status: 'unpaid',
          year,
          term,
          class_id: classId ? parseInt(classId) : null,
          invoice_code: invoiceCode,
          class_name: className || '',
          can_delete: '',
        },
      });

      return NextResponse.json({ invoice, message: 'Invoice created successfully' });
    }

    // Create mass invoices (bulk)
    if (action === 'create-mass') {
      const { classId, items, date, term, year } = body;
      if (!classId) {
        return NextResponse.json({ error: 'Class is required' }, { status: 400 });
      }
      if (!items || items.length === 0) {
        return NextResponse.json({ error: 'At least one billing item is required' }, { status: 400 });
      }

      const totalAmount = items.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0);
      const timestamp = date ? new Date(date) : new Date();
      const invTitle = `${term} Fees - ${year}`;

      // Get enrolled students for this class
      const enrollments = await db.enroll.findMany({
        where: { class_id: parseInt(classId), year, term, mute: 0 },
        select: { student_id: true },
      });

      if (enrollments.length === 0) {
        return NextResponse.json({ error: 'No students enrolled in this class for the selected year/term' }, { status: 400 });
      }

      const results: any[] = [];
      let skipped = 0;

      for (const enrollment of enrollments) {
        // Check for duplicate
        const existing = await db.invoice.findFirst({
          where: {
            student_id: enrollment.student_id,
            year,
            term,
            class_id: parseInt(classId),
            title: invTitle,
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        const invoiceCode = `INV-${year?.replace('-', '') || new Date().getFullYear().toString().slice(2)}-${String(Date.now()).slice(-6)}-${String(enrollment.student_id).slice(-3)}`;

        const invoice = await db.invoice.create({
          data: {
            student_id: enrollment.student_id,
            title: invTitle,
            description: items.map((i: { title: string }) => i.title).join(', '),
            amount: totalAmount,
            amount_paid: 0,
            due: totalAmount,
            discount: 0,
            creation_timestamp: timestamp,
            status: 'unpaid',
            year,
            term,
            class_id: parseInt(classId),
            invoice_code: invoiceCode,
            class_name: '',
            can_delete: '',
          },
        });
        results.push(invoice);
      }

      return NextResponse.json({
        invoices: results,
        skipped,
        message: `${results.length} invoice(s) created${skipped > 0 ? `, ${skipped} skipped (already exist)` : ''}`,
      });
    }

    // Bulk delete invoices
    if (action === 'bulk-delete') {
      const { invoiceIds } = body;
      if (!invoiceIds || invoiceIds.length === 0) {
        return NextResponse.json({ error: 'No invoices selected' }, { status: 400 });
      }
      await db.payment.deleteMany({ where: { invoice_id: { in: invoiceIds } } });
      await db.receipts.deleteMany({ where: { invoice_code: { in: (await db.invoice.findMany({ where: { invoice_id: { in: invoiceIds } }, select: { invoice_code: true } })).map(i => i.invoice_code) } } });
      const result = await db.invoice.deleteMany({ where: { invoice_id: { in: invoiceIds } } });
      return NextResponse.json({ deleted: result.count, message: `${result.count} invoice(s) deleted` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
