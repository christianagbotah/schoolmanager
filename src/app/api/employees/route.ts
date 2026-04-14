import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const department_id = searchParams.get('department_id')
  const designation_id = searchParams.get('designation_id')
  const status = searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { emp_id: { contains: search } },
      { email: { contains: search } },
    ]
  }
  if (department_id) where.department_id = parseInt(department_id)
  if (designation_id) where.designation_id = parseInt(designation_id)
  if (status !== null && status !== undefined && status !== '') where.active_status = parseInt(status)

  const employees = await db.employee.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    include: {
      department: true,
      designation: true,
    },
    orderBy: { id: 'desc' },
    take: 200,
  })

  return NextResponse.json(employees)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { emp_id, name, designation_id, department_id, email, phone, birthday, sex, hire_date, salary, active_status } = body

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const employee = await db.employee.create({
    data: {
      emp_id: emp_id || `EMP-${Date.now()}`,
      name,
      designation_id: designation_id ? parseInt(designation_id) : null,
      department_id: department_id ? parseInt(department_id) : null,
      email: email || '',
      phone: phone || '',
      birthday: birthday ? new Date(birthday) : null,
      sex: sex || '',
      hire_date: hire_date ? new Date(hire_date) : null,
      salary: salary ? parseFloat(salary) : 0,
      active_status: active_status !== undefined ? (active_status ? 1 : 0) : 1,
    },
  })

  return NextResponse.json(employee, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body

  if (!id) return NextResponse.json({ error: 'Employee ID required' }, { status: 400 })

  const employee = await db.employee.update({
    where: { id: parseInt(id) },
    data: {
      emp_id: data.emp_id,
      name: data.name,
      designation_id: data.designation_id ? parseInt(data.designation_id) : null,
      department_id: data.department_id ? parseInt(data.department_id) : null,
      email: data.email || '',
      phone: data.phone || '',
      birthday: data.birthday ? new Date(data.birthday) : null,
      sex: data.sex || '',
      hire_date: data.hire_date ? new Date(data.hire_date) : null,
      salary: data.salary ? parseFloat(data.salary) : undefined,
      active_status: data.active_status !== undefined ? (data.active_status ? 1 : 0) : undefined,
    },
  })

  return NextResponse.json(employee)
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await db.pay_salary.deleteMany({ where: { employee_code: id } })
  await db.employee.delete({ where: { id: parseInt(id) } })

  return NextResponse.json({ success: true })
}
