import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/admin/exams/sms-marks - Send exam marks via SMS/Email to parents
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { exam_id, class_id, method, receiver_type, student_id } = body

    if (!exam_id || !class_id) {
      return NextResponse.json({ error: 'exam_id and class_id are required' }, { status: 400 })
    }

    // Get enrolled students for this class
    const enrollments = await db.enroll.findMany({
      where: {
        class_id: parseInt(class_id),
        mute: 0,
      },
      include: {
        student: {
          select: {
            student_id: true,
            name: true,
            student_code: true,
            parent: {
              select: {
                parent_id: true,
                name: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { roll: 'asc' },
    })

    // Get marks for these students in the given exam
    const marks = await db.mark.findMany({
      where: {
        exam_id: parseInt(exam_id),
        class_id: parseInt(class_id),
      },
      include: {
        student: {
          select: {
            student_id: true,
            name: true,
            student_code: true,
            parent: {
              select: {
                parent_id: true,
                name: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        subject: {
          select: { name: true },
        },
        exam: {
          select: { name: true, year: true },
        },
      },
    })

    // Filter for single student if specified
    const targetMarks = student_id
      ? marks.filter(m => m.student_id === parseInt(student_id))
      : marks

    if (targetMarks.length === 0) {
      return NextResponse.json({ error: 'No marks found for the selected criteria' }, { status: 404 })
    }

    // Get exam info
    const examInfo = await db.exam.findUnique({
      where: { exam_id: parseInt(exam_id) },
      select: { name: true, year: true },
    })

    // Prepare SMS/Email messages
    let sentCount = 0
    let failedCount = 0
    const results: { student_name: string; parent_name: string; phone: string; email: string; status: string; message: string }[] = []

    // Group marks by student
    const marksByStudent = new Map<number, typeof targetMarks>()
    for (const m of targetMarks) {
      if (!marksByStudent.has(m.student_id)) {
        marksByStudent.set(m.student_id, [])
      }
      marksByStudent.get(m.student_id)!.push(m)
    }

    for (const [studentId, studentMarks] of marksByStudent) {
      const student = studentMarks[0].student
      const parent = student.parent

      if (!parent && receiver_type !== 'student') {
        failedCount++
        results.push({
          student_name: student.name,
          parent_name: 'N/A',
          phone: '',
          email: '',
          status: 'failed',
          message: 'No parent found',
        })
        continue
      }

      // Build marks summary
      const marksSummary = studentMarks
        .map(m => `${m.subject.name}: ${m.mark_obtained}`)
        .join(', ')

      const totalScore = studentMarks.reduce((sum, m) => sum + (m.mark_obtained || 0), 0)
      const avgScore = studentMarks.length > 0 ? (totalScore / studentMarks.length).toFixed(1) : '0'

      const smsMessage = `Dear ${receiver_type === 'student' ? student.name : parent?.name}, ${student.name}'s results for ${examInfo?.name || 'Exam'}: ${marksSummary}. Total: ${totalScore}, Average: ${avgScore}. Thank you.`

      if (method === 'sms' || method === 'both') {
        const phone = receiver_type === 'student' ? student.student_code : parent?.phone
        if (!phone) {
          failedCount++
          results.push({
            student_name: student.name,
            parent_name: parent?.name || 'N/A',
            phone: phone || '',
            email: parent?.email || '',
            status: 'failed',
            message: 'No phone number found',
          })
          continue
        }

        // Simulate SMS sending (in production, integrate with SMS gateway)
        console.log(`SMS to ${phone}: ${smsMessage}`)
        sentCount++
        results.push({
          student_name: student.name,
          parent_name: parent?.name || 'N/A',
          phone: phone,
          email: parent?.email || '',
          status: 'sent',
          message: smsMessage,
        })
      }

      if (method === 'email' || method === 'both') {
        const email = receiver_type === 'student' ? (student as Record<string, unknown>).email : parent?.email
        if (!email) {
          failedCount++
          results.push({
            student_name: student.name,
            parent_name: parent?.name || 'N/A',
            phone: parent?.phone || '',
            email: email || '',
            status: 'failed',
            message: 'No email found',
          })
          continue
        }

        // Simulate email sending (in production, integrate with email service)
        console.log(`Email to ${email}: ${smsMessage}`)
        sentCount++
        results.push({
          student_name: student.name,
          parent_name: parent?.name || 'N/A',
          phone: parent?.phone || '',
          email: email,
          status: 'sent',
          message: smsMessage,
        })
      }
    }

    return NextResponse.json({
      success: true,
      sent_count: sentCount,
      failed_count: failedCount,
      total_students: marksByStudent.size,
      exam: examInfo,
      results,
    })
  } catch (error) {
    console.error('SMS marks POST error:', error)
    return NextResponse.json({ error: 'Failed to send marks' }, { status: 500 })
  }
}
