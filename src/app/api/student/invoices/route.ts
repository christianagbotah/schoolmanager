import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { verifyStudent, studentError } from "@/lib/verify-student";

export async function GET() {
  const auth = await verifyStudent();
  if (auth.error) return studentError(auth.error);

  try {
    const studentId = auth.studentId;

    const invoices = await db.invoice.findMany({
      where: { student_id: studentId, can_delete: { not: "trash" } },
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
      },
    });

    // Fetch receipts
    const receipts = await db.receipts.findMany({
      where: { student_id: studentId },
      orderBy: { generated_at: "desc" },
      take: 50,
    });

    const totalBilled = invoices.reduce((s, i) => s + (i.amount || 0), 0);
    const totalPaid = invoices.reduce((s, i) => s + (i.amount_paid || 0), 0);
    const totalDue = invoices.reduce((s, i) => s + (i.due || 0), 0);

    return NextResponse.json({
      invoices,
      receipts,
      summary: { totalBilled, totalPaid, totalDue },
    });
  } catch (error) {
    console.error("Student invoices error:", error);
    return NextResponse.json({ error: "Failed to load invoices" }, { status: 500 });
  }
}
