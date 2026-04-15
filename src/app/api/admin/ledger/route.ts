import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/ledger - student financial ledger
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const student_id = searchParams.get('student_id')
  const search = searchParams.get('search') || ''

  if (!student_id) {
    // Return list of students with balance for lookup
    const where: Record<string, unknown> = { active_status: 1 }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { student_code: { contains: search } },
      ]
    }

    const students = await db.student.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      select: {
        student_id: true, name: true, student_code: true, sex: true,
      },
      orderBy: { name: 'asc' },
      take: 50,
    })

    // Get balance for each student
    const studentsWithBalance = await Promise.all(
      students.map(async (s) => {
        const invoices = await db.invoice.findMany({
          where: { student_id: s.student_id, mute: 0 },
          select: { amount: true, amount_paid: true, due: true, status: true },
        })
        const totalBilled = invoices.reduce((sum, i) => sum + i.amount, 0)
        const totalPaid = invoices.reduce((sum, i) => sum + i.amount_paid, 0)
        const balance = totalBilled - totalPaid
        return { ...s, totalBilled, totalPaid, balance, invoiceCount: invoices.length }
      })
    )

    return NextResponse.json(studentsWithBalance)
  }

  // Full ledger for a specific student
  const sid = parseInt(student_id)
  const student = await db.student.findUnique({
    where: { student_id: sid },
    select: { student_id: true, name: true, student_code: true, sex: true, class_reached: true },
  })

  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const invoices = await db.invoice.findMany({
    where: { student_id: sid, mute: 0 },
    orderBy: { creation_timestamp: 'asc' },
  })

  const payments = await db.payment.findMany({
    where: { student_id: sid },
    orderBy: { timestamp: 'asc' },
  })

  const dailyFees = await db.daily_fee_transactions.findMany({
    where: { student_id: sid },
    orderBy: { payment_date: 'asc' },
  })

  const totalBilled = invoices.reduce((s, i) => s + i.amount, 0)
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
  const dailyFeesPaid = dailyFees.reduce((s, d) => s + d.total_amount, 0)
  const balance = totalBilled - totalPaid
  const paidCount = invoices.filter(i => i.status === 'paid').length
  const unpaidCount = invoices.filter(i => i.status === 'unpaid' || i.status === 'partial').length

  return NextResponse.json({
    student,
    summary: { totalBilled, totalPaid, dailyFeesPaid, balance, invoiceCount: invoices.length, paymentCount: payments.length, paidCount, unpaidCount },
    invoices,
    payments,
    dailyFees,
  })
}
