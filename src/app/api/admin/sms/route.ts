import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/sms - SMS logs, templates, automations, settings, stats
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  if (action === 'logs') {
    const logs = await db.sms_log.findMany({
      orderBy: { sent_at: 'desc' },
      take: 100,
    })
    const sent = await db.sms_log.count({ where: { status: 'sent' } })
    const failed = await db.sms_log.count({ where: { status: 'failed' } })
    const pending = await db.sms_log.count({ where: { status: 'pending' } })
    const total = await db.sms_log.count()

    return NextResponse.json({
      logs,
      stats: { sent, failed, pending, total },
    })
  }

  if (action === 'templates') {
    const templates = await db.sms_templates.findMany({
      orderBy: { sms_template_id: 'desc' },
    })
    return NextResponse.json(templates)
  }

  if (action === 'automations') {
    const automations = await db.sms_automations.findMany({
      orderBy: { sms_automation_id: 'desc' },
    })
    const total = await db.sms_automations.count()
    const active = await db.sms_automations.count({ where: { is_active: 1 } })
    const totalSent = await db.sms_automation_logs.count({ where: { status: 'sent' } })
    const totalFailed = await db.sms_automation_logs.count({ where: { status: 'failed' } })
    const successRate = totalSent + totalFailed > 0
      ? Math.round((totalSent / (totalSent + totalFailed)) * 100)
      : 0

    return NextResponse.json({
      automations,
      stats: { total, active, total_sent: totalSent, success_rate: successRate },
    })
  }

  if (action === 'settings') {
    const activeSms = await db.settings.findFirst({ where: { type: 'active_sms_service' } })
    const hubtelSender = await db.settings.findFirst({ where: { type: 'hubtel_sender' } })
    const hubtelClientId = await db.settings.findFirst({ where: { type: 'hubtel_client_id' } })
    const hubtelClientSecret = await db.settings.findFirst({ where: { type: 'hubtel_client_secret' } })
    const attendanceSms = await db.settings.findFirst({ where: { type: 'send_attendance_sms' } })

    return NextResponse.json({
      active_sms_service: activeSms?.description || 'disabled',
      hubtel_sender: hubtelSender?.description || '',
      hubtel_client_id: hubtelClientId?.description || '',
      hubtel_client_secret: hubtelClientSecret?.description || '',
      send_attendance_sms: attendanceSms?.description || '0',
    })
  }

  if (action === 'stats') {
    const sent = await db.sms_log.count({ where: { status: 'sent' } })
    const failed = await db.sms_log.count({ where: { status: 'failed' } })
    const total = await db.sms_log.count()
    const templates = await db.sms_templates.count()

    return NextResponse.json({ sent, failed, total, templates })
  }

  // Default: overview
  const logs = await db.sms_log.findMany({
    orderBy: { sent_at: 'desc' },
    take: 20,
  })
  const templates = await db.sms_templates.findMany({
    orderBy: { sms_template_id: 'desc' },
  })
  const sent = await db.sms_log.count({ where: { status: 'sent' } })
  const failed = await db.sms_log.count({ where: { status: 'failed' } })

  return NextResponse.json({ logs, templates, stats: { sent, failed, total: sent + failed } })
}

// POST /api/admin/sms - Send SMS, save template, create automation, update settings
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action } = body

  if (action === 'send') {
    // Send SMS (mirrors CI3 message/sms_send)
    const { recipient_type, recipients, message } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    let phoneNumbers: string[] = []
    let count = 0

    if (recipient_type === 'custom' && recipients) {
      // Custom phone numbers
      phoneNumbers = recipients.split(',').map((n: string) => n.trim()).filter(Boolean)
    } else if (recipient_type === 'all') {
      // All parents, teachers, students
      const parents = await db.parent.findMany({ select: { phone: true } })
      const teachers = await db.teacher.findMany({ select: { phone: true } })
      const students = await db.student.findMany({ select: { phone: true } })
      phoneNumbers = [
        ...parents.map(p => p.phone).filter(Boolean),
        ...teachers.map(t => t.phone).filter(Boolean),
        ...students.map(s => s.phone).filter(Boolean),
      ]
    } else if (recipient_type === 'parents') {
      const parents = await db.parent.findMany({ select: { phone: true } })
      phoneNumbers = parents.map(p => p.phone).filter(Boolean)
    } else if (recipient_type === 'teachers') {
      const teachers = await db.teacher.findMany({ select: { phone: true } })
      phoneNumbers = teachers.map(t => t.phone).filter(Boolean)
    } else if (recipient_type === 'students') {
      const students = await db.student.findMany({ select: { phone: true } })
      phoneNumbers = students.map(s => s.phone).filter(Boolean)
    }

    // Log each SMS
    for (const phone of phoneNumbers) {
      await db.sms_log.create({
        data: {
          phone_number: phone,
          message: message,
          status: 'sent', // In production, this would be the actual API response
          sent_at: new Date(),
          gateway: 'hubtel',
          recipient_type: recipient_type || 'custom',
        },
      })
      count++
    }

    return NextResponse.json({
      success: true,
      count,
      message: `SMS logged for ${count} recipients (SMS service integration required for actual delivery)`,
    })
  }

  if (action === 'save_template') {
    const { name, content, category, variables } = body
    if (!name || !content) {
      return NextResponse.json({ error: 'Name and content required' }, { status: 400 })
    }

    const template = await db.sms_templates.create({
      data: {
        name,
        content,
        category: category || 'general',
        variables: variables || '',
        is_active: 1,
      },
    })

    return NextResponse.json(template, { status: 201 })
  }

  if (action === 'create_automation') {
    const { name, trigger_event, template_id, recipient_group, is_active, cooldown_minutes } = body
    if (!name || !trigger_event) {
      return NextResponse.json({ error: 'Name and trigger event required' }, { status: 400 })
    }

    const automation = await db.sms_automations.create({
      data: {
        name,
        trigger_event,
        template_id: template_id || null,
        recipient_group: recipient_group || 'all',
        is_active: is_active !== undefined ? is_active : 1,
        cooldown_minutes: cooldown_minutes || 60,
      },
    })

    return NextResponse.json(automation, { status: 201 })
  }

  if (action === 'update_settings') {
    const { active_sms_service, hubtel_sender, hubtel_client_id, hubtel_client_secret, send_attendance_sms } = body

    if (active_sms_service !== undefined) {
      await db.settings.upsert({
        where: { settings_id: 1, type: 'active_sms_service' },
        update: { description: active_sms_service },
        create: { type: 'active_sms_service', description: active_sms_service },
      })
      // Try a simpler upsert approach
    }

    // Update settings individually
    const settingsMap: Record<string, string> = {
      active_sms_service,
      hubtel_sender,
      hubtel_client_id,
      hubtel_client_secret,
      send_attendance_sms,
    }

    for (const [key, value] of Object.entries(settingsMap)) {
      if (value !== undefined) {
        const existing = await db.settings.findFirst({ where: { type: key } })
        if (existing) {
          await db.settings.update({
            where: { settings_id: existing.settings_id },
            data: { description: value },
          })
        } else {
          await db.settings.create({
            data: { type: key, description: value },
          })
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Settings updated' })
  }

  if (action === 'toggle_automation') {
    const { automation_id } = body
    if (!automation_id) {
      return NextResponse.json({ error: 'Automation ID required' }, { status: 400 })
    }

    const existing = await db.sms_automations.findUnique({ where: { sms_automation_id: automation_id } })
    if (!existing) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }

    const updated = await db.sms_automations.update({
      where: { sms_automation_id: automation_id },
      data: { is_active: existing.is_active === 1 ? 0 : 1 },
    })

    return NextResponse.json(updated)
  }

  if (action === 'send_bill_reminder') {
    // Get parents with outstanding balances (mirrors CI3 send_bill_reminder)
    const running_year = await db.settings.findFirst({ where: { type: 'running_year' } })
    const year = running_year?.description || ''

    const unpaidInvoices = await db.invoice.findMany({
      where: { due: { gt: 0 }, year },
      include: { student: { select: { student_id: true, name: true, parent_id: true } } },
      take: 100,
    })

    const parentIds = [...new Set(unpaidInvoices.map(i => i.student?.parent_id).filter(Boolean))]
    const parents = await db.parent.findMany({
      where: { parent_id: { in: parentIds as number[] } },
      select: { parent_id: true, name: true, phone: true },
    })

    let count = 0
    for (const parent of parents) {
      if (!parent.phone) continue
      const studentInvoices = unpaidInvoices.filter(i => i.student?.parent_id === parent.parent_id)
      const totalDue = studentInvoices.reduce((sum, i) => sum + i.due, 0)

      await db.sms_log.create({
        data: {
          phone_number: parent.phone,
          message: `Dear ${parent.name}, you have an outstanding balance of GHC ${totalDue.toFixed(2)}. Please settle at the accounts office. Thank you.`,
          status: 'sent',
          sent_at: new Date(),
          gateway: 'hubtel',
          recipient_type: 'bill_reminder',
        },
      })
      count++
    }

    return NextResponse.json({
      success: true,
      count,
      message: `Bill reminder SMS logged for ${count} parents`,
    })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

// DELETE /api/admin/sms - Delete template or automation
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 })
  }

  if (action === 'template') {
    await db.sms_templates.delete({ where: { sms_template_id: parseInt(id) } })
    return NextResponse.json({ success: true })
  }

  if (action === 'automation') {
    await db.sms_automation_logs.deleteMany({ where: { automation_id: parseInt(id) } })
    await db.sms_automations.delete({ where: { sms_automation_id: parseInt(id) } })
    return NextResponse.json({ success: true })
  }

  if (action === 'log') {
    await db.sms_log.delete({ where: { sms_log_id: parseInt(id) } })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
