import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/sms/automation - List automations with stats
export async function GET(request: NextRequest) {
  try {
    const automations = await db.sms_automations.findMany({
      orderBy: { sms_automation_id: 'desc' },
    });

    // Get logs for each automation
    const logs = await db.sms_automation_logs.findMany({
      orderBy: { sent_at: 'desc' },
      take: 50,
    });

    // Templates for linking
    const templates = await db.sms_templates.findMany({
      where: { is_active: 1 },
      orderBy: { sms_template_id: 'desc' },
    });

    const total = automations.length;
    const active = automations.filter(a => a.is_active === 1).length;
    const totalSent = logs.filter(l => l.status === 'sent').length;
    const totalFailed = logs.filter(l => l.status === 'failed').length;

    // Automation stats per automation
    const automationStats: Record<number, { sent: number; failed: number; lastRun: string | null }> = {};
    for (const log of logs) {
      if (!automationStats[log.automation_id]) {
        automationStats[log.automation_id] = { sent: 0, failed: 0, lastRun: null };
      }
      if (log.status === 'sent') automationStats[log.automation_id].sent++;
      if (log.status === 'failed') automationStats[log.automation_id].failed++;
      if (log.sent_at && !automationStats[log.automation_id].lastRun) {
        automationStats[log.automation_id].lastRun = new Date(log.sent_at).toISOString();
      }
    }

    // Trigger events
    const triggerEvents = [
      { value: 'attendance_absent', label: 'Student Absent (Attendance)', description: 'When a student is marked absent' },
      { value: 'attendance_late', label: 'Student Late', description: 'When a student arrives late' },
      { value: 'fee_reminder', label: 'Fee Reminder', description: 'Periodic reminder for outstanding fees' },
      { value: 'fee_overdue', label: 'Fee Overdue', description: 'When fees become overdue' },
      { value: 'exam_results', label: 'Exam Results Published', description: 'When exam results are published' },
      { value: 'report_card', label: 'Report Card Ready', description: 'When terminal reports are ready' },
      { value: 'general_notice', label: 'New Notice Published', description: 'When a new notice is published' },
      { value: 'payment_received', label: 'Payment Received', description: 'When a payment is recorded' },
      { value: 'enrollment_confirmation', label: 'Enrollment Confirmation', description: 'When student is enrolled' },
      { value: 'event_reminder', label: 'Event Reminder', description: 'Reminder for upcoming school events' },
    ];

    return NextResponse.json({
      automations,
      automationStats,
      templates,
      logs: logs.slice(0, 20),
      stats: {
        total,
        active,
        inactive: total - active,
        totalSent,
        totalFailed,
        successRate: totalSent + totalFailed > 0 ? Math.round((totalSent / (totalSent + totalFailed)) * 100) : 0,
      },
      triggerEvents,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/sms/automation - Create or update automation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, automation_id, name, trigger_event, template_id, recipient_group, is_active, cooldown_minutes, message_template } = body;

    if (action === 'create') {
      if (!name || !trigger_event) {
        return NextResponse.json({ error: 'Name and trigger event are required' }, { status: 400 });
      }

      const automation = await db.sms_automations.create({
        data: {
          name,
          trigger_event,
          template_id: template_id || null,
          recipient_group: recipient_group || 'parents',
          is_active: is_active !== undefined ? is_active : 1,
          cooldown_minutes: cooldown_minutes || 60,
          message_template: message_template || '',
        },
      });

      return NextResponse.json({ status: 'success', message: 'Automation created', automation }, { status: 201 });
    }

    if (action === 'update') {
      if (!automation_id) {
        return NextResponse.json({ error: 'automation_id required' }, { status: 400 });
      }

      const data: any = {};
      if (name !== undefined) data.name = name;
      if (trigger_event !== undefined) data.trigger_event = trigger_event;
      if (template_id !== undefined) data.template_id = template_id;
      if (recipient_group !== undefined) data.recipient_group = recipient_group;
      if (is_active !== undefined) data.is_active = is_active;
      if (cooldown_minutes !== undefined) data.cooldown_minutes = cooldown_minutes;
      if (message_template !== undefined) data.message_template = message_template;

      await db.sms_automations.update({
        where: { sms_automation_id: automation_id },
        data,
      });

      return NextResponse.json({ status: 'success', message: 'Automation updated' });
    }

    if (action === 'toggle') {
      if (!automation_id) {
        return NextResponse.json({ error: 'automation_id required' }, { status: 400 });
      }

      const current = await db.sms_automations.findUnique({ where: { sms_automation_id: automation_id } });
      if (!current) {
        return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
      }

      await db.sms_automations.update({
        where: { sms_automation_id: automation_id },
        data: { is_active: current.is_active === 1 ? 0 : 1 },
      });

      return NextResponse.json({ status: 'success', message: current.is_active ? 'Automation disabled' : 'Automation enabled' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/sms/automation - Delete automation
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '0');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    await db.sms_automation_logs.deleteMany({ where: { automation_id: id } });
    await db.sms_automations.delete({ where: { sms_automation_id: id } });

    return NextResponse.json({ status: 'success', message: 'Automation deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
