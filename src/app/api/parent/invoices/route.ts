import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const parentId = parseInt(session.user.id);
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("student_id");
    const status = searchParams.get("status");

    // Get children
    const children = await db.student.findMany({
      where: { parent_id: parentId },
      select: {
        student_id: true,
        name: true,
        first_name: true,
        last_name: true,
        student_code: true,
        mute: true,
      },
    });

    const childIds = children.map((c) => c.student_id);

    if (childIds.length === 0) {
      return NextResponse.json({ children: [], invoices: [], payments: [], summary: { totalBilled: 0, totalPaid: 0, totalDue: 0 } });
    }

    // Build invoice filter
    const invoiceWhere: Record<string, unknown> = {
      student_id: { in: childIds },
      can_delete: { not: "trash" },
    };
    if (studentId) invoiceWhere.student_id = parseInt(studentId);
    if (status && status !== "all") {
      if (status === "paid") invoiceWhere.due = 0;
      else if (status === "unpaid") invoiceWhere.due = { gt: 0 };
    }

    const invoices = await db.invoice.findMany({
      where: invoiceWhere,
      orderBy: { creation_timestamp: "desc" },
      select: {
        invoice_id: true,
        invoice_code: true,
        title: true,
        description: true,
        amount: true,
        amount_paid: true,
        due: true,
        discount: true,
        status: true,
        year: true,
        term: true,
        creation_timestamp: true,
        payment_timestamp: true,
        student_id: true,
      },
    });

    // Build payment filter
    const paymentWhere: Record<string, unknown> = { student_id: { in: childIds } };
    if (studentId) paymentWhere.student_id = parseInt(studentId);

    const payments = await db.payment.findMany({
      where: paymentWhere,
      orderBy: { timestamp: "desc" },
      select: {
        payment_id: true,
        receipt_code: true,
        invoice_code: true,
        title: true,
        amount: true,
        payment_method: true,
        payment_type: true,
        timestamp: true,
        approval_status: true,
        student_id: true,
      },
    });

    // Get receipts
    const receiptWhere: Record<string, unknown> = { student_id: { in: childIds } };
    if (studentId) receiptWhere.student_id = parseInt(studentId);

    const receipts = await db.receipts.findMany({
      where: receiptWhere,
      orderBy: { generated_at: "desc" },
      take: 50,
    });

    // Get MoMo settings
    const [moName, moNumber, currency] = await Promise.all([
      db.settings.findFirst({ where: { type: "mo_account_name" } }),
      db.settings.findFirst({ where: { type: "mo_account_number" } }),
      db.settings.findFirst({ where: { type: "currency" } }),
    ]);

    const totalBilled = invoices.reduce((s, i) => s + (i.amount || 0), 0);
    const totalPaid = invoices.reduce((s, i) => s + (i.amount_paid || 0), 0);
    const totalDue = invoices.reduce((s, i) => s + (i.due || 0), 0);

    return NextResponse.json({
      children,
      invoices,
      payments,
      receipts,
      summary: { totalBilled, totalPaid, totalDue },
      moAccountName: moName?.description || "",
      moAccountNumber: moNumber?.description || "",
      currency: currency?.description || "GHS",
    });
  } catch (error) {
    console.error("Parent invoices error:", error);
    return NextResponse.json({ error: "Failed to load invoices" }, { status: 500 });
  }
}
