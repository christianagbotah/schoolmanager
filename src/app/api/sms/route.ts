import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const history = await db.daily_fee_transactions.findMany({
      orderBy: { id: 'desc' },
      take: 50,
    })

    return NextResponse.json({ history })
  } catch (error) {
    console.error('Error fetching SMS:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipient_type, class_id, message, custom_numbers, action, name, content } = body

    if (action === 'save_template') {
      // Store template in settings
      await db.settings.create({
        data: { type: 'sms_template', description: name, value: content },
      })
      return NextResponse.json({ success: true })
    }

    if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 })

    // Log the SMS (in production, integrate with Hubtel API)
    const smsLog = await db.daily_fee_transactions.create({
      data: {
        transaction_code: `SMS-${Date.now()}`,
        student_id: 0,
        total_amount: 0,
        payment_method: 'sms',
        collected_by: 'system',
      },
    })

    return NextResponse.json({ success: true, id: smsLog.id, count: 1 })
  } catch (error) {
    console.error('Error sending SMS:', error)
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 })
  }
}
