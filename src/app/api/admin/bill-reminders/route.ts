import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/bill-reminders - get reminder stats and overdue data
export async function GET() {
  const runningYear = await db.settings.findFirst({ where: { type: 'running_year' } })
  const year = runningYear?.description || ''

  // Outstanding invoices
  const unpaidInvoices = await db.invoice.findMany({
    where: { due: { gt: 0 }, year, mute: 0 },
    include: {
      student: {
        select: {
          student_id: true, name: true, student_code: true, parent_id: true, phone: true,
        },
      },
    },
    orderBy: { due: 'desc' },
    take: 200,
  })

  // Group by parent
  const parentMap = new Map<number, {
    parent: { parent_id: number; name: string; phone: string } | null;
    students: { student_id: number; name: string; student_code: string; invoices: typeof unpaidInvoices; totalDue: number }[];
    totalDue: number;
  }>()

  for (const inv of unpaidInvoices) {
    const pid = inv.student?.parent_id
    if (!pid) continue

    if (!parentMap.has(pid)) {
      const parent = await db.parent.findUnique({ where: { parent_id: pid }, select: { parent_id: true, name: true, phone: true } })
      parentMap.set(pid, { parent, students: [], totalDue: 0 })
    }

    const entry = parentMap.get(pid)!
    const existingStudent = entry.students.find(s => s.student_id === inv.student?.student_id)
    if (existingStudent) {
      existingStudent.invoices.push(inv)
      existingStudent.totalDue += inv.due
    } else if (inv.student) {
      entry.students.push({
        student_id: inv.student.student_id,
        name: inv.student.name,
        student_code: inv.student.student_code,
        invoices: [inv],
        totalDue: inv.due,
      })
    }
    entry.totalDue += inv.due
  }

  const parentDebts = Array.from(parentMap.values()).filter(p => p.parent.phone)

  // Stats
  const totalOverdue = unpaidInvoices.length
  const totalAmount = unpaidInvoices.reduce((s, i) => s + i.due, 0)
  const parentsWithDebt = parentDebts.length

  return NextResponse.json({
    stats: { totalOverdue, totalAmount, parentsWithDebt },
    invoices: unpaidInvoices.slice(0, 100),
    parentDebts: parentDebts.map(p => ({
      parent_id: p.parent?.parent_id,
      parent_name: p.parent?.name,
      phone: p.parent?.phone,
      total_due: p.totalDue,
      student_count: p.students.length,
      students: p.students.map(s => ({ name: s.name, student_code: s.student_code, totalDue: s.totalDue, invoiceCount: s.invoices.length })),
    })),
  })
}

// POST /api/admin/bill-reminders - send reminders
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, parent_ids, custom_message } = body

  if (action === 'send_bulk') {
    const runningYear = await db.settings.findFirst({ where: { type: 'running_year' } })
    const year = runningYear?.description || ''

    const unpaidInvoices = await db.invoice.findMany({
      where: { due: { gt: 0 }, year, mute: 0 },
      include: { student: { select: { student_id: true, name: true, parent_id: true } } },
      take: 200,
    })

    const parentIds = [...new Set(unpaidInvoices.map(i => i.student?.parent_id).filter(Boolean))]
    const parents = await db.parent.findMany({
      where: { parent_id: { in: parentIds as number[] }, phone: { not: '' } },
      select: { parent_id: true, name: true, phone: true },
    })

    let count = 0
    for (const parent of parents) {
      const studentInvoices = unpaidInvoices.filter(i => i.student?.parent_id === parent.parent_id)
      const totalDue = studentInvoices.reduce((sum, i) => sum + i.due, 0)

      const msg = custom_message
        ? custom_message.replace('{name}', parent.name).replace('{amount}', totalDue.toFixed(2))
        : `Dear ${parent.name}, you have an outstanding balance of GHC ${totalDue.toFixed(2)}. Please settle at the accounts office. Thank you.`

      await db.sms_log.create({
        data: {
          phone_number: parent.phone,
          message: msg,
          status: 'sent',
          sent_at: new Date(),
          gateway: 'hubtel',
          recipient_type: 'bill_reminder',
        },
      })
      count++
    }

    return NextResponse.json({ success: true, count, message: `Bill reminder sent to ${count} parents` })
  }

  if (action === 'send_to_parent') {
    const { parent_id } = body
    if (!parent_id) return NextResponse.json({ error: 'Parent ID required' }, { status: 400 })

    const unpaidInvoices = await db.invoice.findMany({
      where: { due: { gt: 0 }, student: { parent_id: parseInt(parent_id) }, mute: 0 },
      include: { student: { select: { name: true } } },
    })

    if (unpaidInvoices.length === 0) return NextResponse.json({ error: 'No outstanding invoices' }, { status: 404 })

    const parent = await db.parent.findUnique({ where: { parent_id: parseInt(parent_id) } })
    if (!parent?.phone) return NextResponse.json({ error: 'No phone number' }, { status: 400 })

    const totalDue = unpaidInvoices.reduce((s, i) => s + i.due, 0)
    const msg = custom_message
      ? custom_message.replace('{name}', parent.name).replace('{amount}', totalDue.toFixed(2))
      : `Dear ${parent.name}, you have an outstanding balance of GHC ${totalDue.toFixed(2)}. Please settle at the accounts office. Thank you.`

    await db.sms_log.create({
      data: { phone_number: parent.phone, message: msg, status: 'sent', sent_at: new Date(), gateway: 'hubtel', recipient_type: 'bill_reminder' },
    })

    return NextResponse.json({ success: true, count: 1, message: 'Reminder sent' })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
