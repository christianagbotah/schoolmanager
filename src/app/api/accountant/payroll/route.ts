import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/accountant/payroll - Payroll management
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || '';
    const year = searchParams.get('year') || '';
    const search = searchParams.get('search') || '';
    const departmentId = searchParams.get('departmentId');

    // All employees for payroll processing
    const employeeWhere: Record<string, unknown> = { active_status: 1 };
    if (departmentId) employeeWhere.department_id = parseInt(departmentId);

    const [employees, departments, designations] = await Promise.all([
      db.employee.findMany({
        where: Object.keys(employeeWhere).length > 0 ? employeeWhere : undefined,
        include: {
          designation: { select: { des_name: true } },
          department: { select: { dep_name: true } },
          salaries: { orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 1 },
        },
        orderBy: { name: 'asc' },
      }),
      db.department.findMany(),
      db.designation.findMany(),
    ]);

    // Filter by search
    let filteredEmployees = employees;
    if (search) {
      const s = search.toLowerCase();
      filteredEmployees = employees.filter(e =>
        e.name?.toLowerCase().includes(s) || e.emp_id?.toLowerCase().includes(s)
      );
    }

    // Payslips filtered by month/year
    const payslipWhere: Record<string, unknown> = {};
    if (month) payslipWhere.month = month;
    if (year) payslipWhere.year = year;

    const payslips = await db.pay_salary.findMany({
      where: Object.keys(payslipWhere).length > 0 ? payslipWhere : undefined,
      include: {
        employee: {
          select: {
            name: true,
            emp_id: true,
            designation: { select: { des_name: true } },
            department: { select: { dep_name: true } },
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    // Summary
    const totalPayroll = payslips.reduce((s, p) => s + (p.net_salary || 0), 0);
    const processedCount = payslips.length;
    const pendingCount = filteredEmployees.length - processedCount;

    // Monthly totals for the last 6 months
    const now = new Date();
    const monthlyTotals: { month: string; year: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.toLocaleString('en-US', { month: 'short' });
      const y = d.getFullYear().toString();
      const monthPayslips = payslips.filter(p => p.month === m && p.year === y);
      monthlyTotals.push({
        month: m,
        year: y,
        total: monthPayslips.reduce((s, p) => s + (p.net_salary || 0), 0),
      });
    }

    return NextResponse.json({
      employees: filteredEmployees.map(e => ({
        ...e,
        department_name: e.department?.dep_name || '',
        designation_name: e.designation?.des_name || '',
        lastSalary: e.salaries?.[0] || null,
      })),
      payslips,
      departments,
      designations,
      summary: {
        totalPayroll,
        processedCount,
        pendingCount,
        totalEmployees: filteredEmployees.length,
        monthlyTotals,
      },
    });
  } catch (error) {
    console.error('Error fetching payroll:', error);
    return NextResponse.json({ error: 'Failed to fetch payroll data' }, { status: 500 });
  }
}

// POST /api/accountant/payroll - Process payroll
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { month, year, employeeCodes } = body;

    if (!month || !year || !employeeCodes?.length) {
      return NextResponse.json({ error: 'month, year, and employeeCodes are required' }, { status: 400 });
    }

    const results: any[] = [];
    const errors: string[] = [];

    for (const empCode of employeeCodes) {
      try {
        const employee = await db.employee.findUnique({
          where: { emp_id: empCode },
          select: { emp_id: true, name: true, salary: true },
        });
        if (!employee) {
          errors.push(`Employee ${empCode} not found`);
          continue;
        }

        // Check if already processed
        const existing = await db.pay_salary.findFirst({
          where: { employee_code: empCode, month, year },
        });
        if (existing) {
          errors.push(`${employee.name} already has a payslip for ${month} ${year}`);
          continue;
        }

        const basicSalary = employee.salary || 0;
        // Simple calculation: gross = basic + 12.5% SSNIT employer
        const grossSalary = basicSalary * 1.125;
        // Deductions: 13.5% SSNIT employee + 0.5% tax placeholder
        const deductions = basicSalary * 0.14;
        const netSalary = grossSalary - deductions;

        const payslip = await db.pay_salary.create({
          data: {
            employee_code: empCode,
            month,
            year,
            basic_salary: basicSalary,
            gross_salary: Math.round(grossSalary * 100) / 100,
            net_salary: Math.round(netSalary * 100) / 100,
            status: 'processed',
          },
        });
        results.push(payslip);
      } catch (err) {
        errors.push(`Error processing ${empCode}`);
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      errors,
      message: `${results.length} payslips processed successfully`,
    });
  } catch (error: any) {
    console.error('Payroll processing error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process payroll' }, { status: 500 });
  }
}
