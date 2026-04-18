import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { verifyStudent, studentError } from "@/lib/verify-student";

export async function GET() {
  const auth = await verifyStudent();
  if (auth.error) return studentError(auth.error);

  try {
    const studentId = auth.studentId;

    const [invoices, payments, receipts, plans] = await Promise.all([
      // Invoices
      db.invoice.findMany({
        where: { student_id: studentId, can_delete: { not: "trash" } },
        orderBy: { creation_timestamp: "desc" },
        select: {
          invoice_id: true, invoice_code: true, title: true, description: true,
          amount: true, amount_paid: true, due: true, discount: true,
          status: true, year: true, term: true, creation_timestamp: true, payment_timestamp: true,
        },
      }),
      // Payments
      db.payment.findMany({
        where: { student_id: studentId },
        orderBy: { timestamp: "desc" },
        select: {
          payment_id: true, receipt_code: true, invoice_code: true, title: true,
          amount: true, payment_method: true, payment_type: true, timestamp: true, approval_status: true,
        },
      }),
      // Receipts
      db.receipts.findMany({
        where: { student_id: studentId },
        orderBy: { generated_at: "desc" },
        take: 50,
      }),
      // Payment Plans with installments
      db.payment_plans.findMany({
        where: { student_id: studentId, is_active: 1 },
        include: {
          fee_structure: {
            select: { fee_structure_id: true, name: true, year: true, term: true },
          },
          installments: {
            orderBy: { installment_number: "asc" },
          },
        },
        orderBy: { created_at: "desc" },
      }),
    ]);

    // Mark overdue installments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (const plan of plans) {
      for (const inst of plan.installments) {
        if (inst.status === "pending" && inst.due_date && new Date(inst.due_date) < today) {
          await db.payment_installments.update({
            where: { installment_id: inst.installment_id },
            data: { status: "overdue" },
          });
          inst.status = "overdue";
        }
      }
    }

    // Payment plan stats
    const totalPlanAmount = plans.reduce((s, p) => s + p.total_amount, 0);
    const totalPlanPaid = plans.reduce((s, p) => s + p.paid_amount, 0);

    // MoMo settings
    const [moName, moNumber, currency] = await Promise.all([
      db.settings.findFirst({ where: { type: "mo_account_name" } }),
      db.settings.findFirst({ where: { type: "mo_account_number" } }),
      db.settings.findFirst({ where: { type: "currency" } }),
    ]);

    const totalBilled = invoices.reduce((s, i) => s + (i.amount || 0), 0);
    const totalPaid = invoices.reduce((s, i) => s + (i.amount_paid || 0), 0);
    const totalDue = invoices.reduce((s, i) => s + (i.due || 0), 0);

    return NextResponse.json({
      invoices,
      payments,
      receipts,
      paymentPlans: plans,
      summary: { totalBilled, totalPaid, totalDue, totalPlanAmount, totalPlanPaid },
      moAccountName: moName?.description || "",
      moAccountNumber: moNumber?.description || "",
      currency: currency?.description || "GHS",
    });
  } catch (error) {
    console.error("Student fees error:", error);
    return NextResponse.json({ error: "Failed to load fee data" }, { status: 500 });
  }
}
