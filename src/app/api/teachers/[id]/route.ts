import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const teacher = await db.teacher.findUnique({
      where: { teacher_id: parseInt(id) },
      include: {
        department: true,
        designation: true,
        classes: {
          include: {
            sections: true,
          },
        },
        sections: true,
        subjects: {
          include: {
            class: true,
            section: true,
          },
        },
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    return NextResponse.json(teacher)
  } catch (error) {
    console.error('Error fetching teacher:', error)
    return NextResponse.json({ error: 'Failed to fetch teacher' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, email, phone, gender, birthday, blood_group, address, department_id, designation_id, joining_date, active_status } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Teacher name is required' }, { status: 400 })
    }

    if (email) {
      const existing = await db.teacher.findFirst({
        where: {
          email: email.trim(),
          NOT: { teacher_id: parseInt(id) },
        },
      })
      if (existing) {
        return NextResponse.json({ error: 'A teacher with this email already exists' }, { status: 409 })
      }
    }

    const teacher = await db.teacher.update({
      where: { teacher_id: parseInt(id) },
      data: {
        name: name.trim(),
        email: email?.trim() || '',
        phone: phone || '',
        gender: gender || '',
        birthday: birthday ? new Date(birthday) : null,
        blood_group: blood_group || '',
        address: address || '',
        department_id: department_id ? parseInt(department_id) : null,
        designation_id: designation_id ? parseInt(designation_id) : null,
        joining_date: joining_date ? new Date(joining_date) : null,
        active_status: active_status !== undefined ? parseInt(active_status) : undefined,
      },
      include: {
        department: true,
        designation: true,
      },
    })

    return NextResponse.json(teacher)
  } catch (error) {
    console.error('Error updating teacher:', error)
    return NextResponse.json({ error: 'Failed to update teacher' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.teacher.delete({
      where: { teacher_id: parseInt(id) },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting teacher:', error)
    return NextResponse.json({ error: 'Failed to delete teacher' }, { status: 500 })
  }
}
