import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') || ''
  const year = searchParams.get('year') || ''
  const status = searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (month) where.month = month
  if (year) where.year = year
  if (status) where.status = status

  const salaries = await db.pay_salary.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    include: {
      employee: true,
    },
    orderBy: { pay_id: 'desc' },
    take: 200,
  })

  return NextResponse.json(salaries)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { employee_code, month, year, basic_salary, gross_salary, net_salary, status } = body

  if (!employee_code || !month || !year) {
    return NextResponse.json({ error: 'employee_code, month, and year are required' }, { status: 400 })
  }

  const salary = await db.pay_salary.create({
    data: {
      employee_code,
      month,
      year,
      basic_salary: basic_salary ? parseFloat(basic_salary) : 0,
      gross_salary: gross_salary ? parseFloat(gross_salary) : 0,
      net_salary: net_salary ? parseFloat(net_salary) : 0,
      status: status || 'pending',
    },
  })

  return NextResponse.json(salary, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { pay_id, ...data } = body

  if (!pay_id) return NextResponse.json({ error: 'Pay ID required' }, { status: 400 })

  const salary = await db.pay_salary.update({
    where: { pay_id: parseInt(pay_id) },
    data: {
      basic_salary: data.basic_salary ? parseFloat(data.basic_salary) : undefined,
      gross_salary: data.gross_salary ? parseFloat(data.gross_salary) : undefined,
      net_salary: data.net_salary ? parseFloat(data.net_salary) : undefined,
      status: data.status || undefined,
    },
  })

  return NextResponse.json(salary)
}

// Bulk process payroll
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { month, year, employees } = body

  if (!month || !year || !employees?.length) {
    return NextResponse.json({ error: 'month, year, and employees are required' }, { status: 400 })
  }

  const results: any[] = []
  for (const emp of employees) {
    const existing = await db.pay_salary.findFirst({
      where: { employee_code: emp.emp_id, month, year },
    })

    if (existing) {
      const updated = await (db.pay_salary as any).update({
        where: { pay_id: existing.pay_id },
        data: {
          basic_salary: emp.salary,
          gross_salary: emp.gross_salary || emp.salary,
          net_salary: emp.net_salary || emp.salary,
          status: 'processed',
        },
      })
      results.push(updated)
    } else {
      const created = await (db.pay_salary as any).create({
        data: {
          employee_code: emp.emp_id,
          month,
          year,
          basic_salary: emp.salary,
          gross_salary: emp.gross_salary || emp.salary,
          net_salary: emp.net_salary || emp.salary,
          status: 'processed',
        },
      })
      results.push(created)
    }
  }

  return NextResponse.json(results)
}
