import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const departmentId = searchParams.get('department_id')
    const designationId = searchParams.get('designation_id')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ]
    }

    if (departmentId) {
      where.department_id = parseInt(departmentId)
    }

    if (designationId) {
      where.designation_id = parseInt(designationId)
    }

    if (status !== null && status !== '' && status !== undefined) {
      where.active_status = parseInt(status)
    }

    const teachers = await db.teacher.findMany({
      where,
      include: {
        department: true,
        designation: true,
        classes: { select: { class_id: true, name: true } },
        sections: { select: { section_id: true, name: true } },
        subjects: { select: { subject_id: true, name: true } },
      },
      orderBy: { teacher_id: 'desc' },
    })

    return NextResponse.json(teachers)
  } catch (error) {
    console.error('Error fetching teachers:', error)
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, gender, birthday, blood_group, address, department_id, designation_id, joining_date, password } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Teacher name is required' }, { status: 400 })
    }

    if (email && !email.trim()) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const existingTeacher = await db.teacher.findFirst({
      where: { email: email?.trim() || '' },
    })

    if (existingTeacher) {
      return NextResponse.json({ error: 'A teacher with this email already exists' }, { status: 409 })
    }

    const teacher = await db.teacher.create({
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
        password: password || '',
        active_status: 1,
      },
      include: {
        department: true,
        designation: true,
      },
    })

    return NextResponse.json(teacher, { status: 201 })
  } catch (error) {
    console.error('Error creating teacher:', error)
    return NextResponse.json({ error: 'Failed to create teacher' }, { status: 500 })
  }
}
