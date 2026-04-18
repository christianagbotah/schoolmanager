import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

const SSNIT_EMPLOYEE_RATE = 0.055;
const SSNIT_EMPLOYER_RATE = 0.08;
const SSNIT_TOTAL_RATE = 0.135;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || '';
    const year = searchParams.get('year') || '';
    const departmentId = searchParams.get('departmentId') || '';
    const employmentType = searchParams.get('employmentType') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build filter for employees
    const empWhere: Record<string, unknown> = { active_status: 1 };
    if (departmentId) empWhere.department_id = parseInt(departmentId);

    // Fetch active employees with department and designation
    const employees = await db.employee.findMany({
      where: Object.keys(empWhere).length > 0 ? empWhere : undefined,
      include: {
        department: { select: { id: true, dep_name: true } },
        designation: { select: { id: true, des_name: true } },
      },
      orderBy: { name: 'asc' },
    });

    // Get payroll records for the selected period
    const payWhere: Record<string, unknown> = {};
    if (month) payWhere.month = month;
    if (year) payWhere.year = year;
    if (Object.keys(payWhere).length > 0) {
      payWhere.status = { in: ['processed', 'paid'] };
    }

    const payrollRecords = await db.pay_salary.findMany({
      where: Object.keys(payWhere).length > 0 ? payWhere : undefined,
      include: {
        employee: {
          select: {
            emp_id: true,
          },
        },
      },
    });

    // Build a map of emp_id -> pay_salary for quick lookup
    const payrollMap = new Map<string, { basic_salary: number; gross_salary: number; status: string }>();
    for (const pr of payrollRecords) {
      payrollMap.set(pr.employee_code, {
        basic_salary: pr.basic_salary,
        gross_salary: pr.gross_salary,
        status: pr.status,
      });
    }

    // Build SSNIT report rows
    const reportRows = employees.map((emp) => {
      const payroll = payrollMap.get(emp.emp_id);
      const basicSalary = payroll?.basic_salary || emp.salary;
      const grossSalary = payroll?.gross_salary || emp.salary;

      const employeeContribution = Math.round(basicSalary * SSNIT_EMPLOYEE_RATE * 100) / 100;
      const employerContribution = Math.round(basicSalary * SSNIT_EMPLOYER_RATE * 100) / 100;
      const totalContribution = Math.round(basicSalary * SSNIT_TOTAL_RATE * 100) / 100;

      return {
        employeeId: emp.id,
        empId: emp.emp_id,
        name: emp.name,
        department: emp.department?.dep_name || 'Unassigned',
        departmentId: emp.department_id,
        designation: emp.designation?.des_name || 'Unassigned',
        basicSalary,
        grossSalary,
        employeeContribution,
        employerContribution,
        totalContribution,
        ssnitNumber: '', // Would come from employee.ssnit_number if field existed
        ssnitTier: 'Tier 1',
        payrollStatus: payroll?.status || 'pending',
      };
    });

    // Filter by employment type if provided
    let filtered = reportRows;
    if (employmentType === 'fulltime') {
      filtered = filtered.filter((r) => r.basicSalary > 0);
    }

    // Summary totals
    const summary = {
      totalEmployees: filtered.length,
      totalGrossSalary: Math.round(filtered.reduce((s, r) => s + r.grossSalary, 0) * 100) / 100,
      totalEmployeeDeduction: Math.round(filtered.reduce((s, r) => s + r.employeeContribution, 0) * 100) / 100,
      totalEmployerContribution: Math.round(filtered.reduce((s, r) => s + r.employerContribution, 0) * 100) / 100,
      totalSSNIT: Math.round(filtered.reduce((s, r) => s + r.totalContribution, 0) * 100) / 100,
    };

    // Determine filing status
    let filingStatus = 'draft';
    if (month && year) {
      const processedCount = filtered.filter((r) => r.payrollStatus === 'processed' || r.payrollStatus === 'paid').length;
      if (processedCount === filtered.length && filtered.length > 0) {
        filingStatus = 'approved';
      } else if (processedCount > 0) {
        filingStatus = 'filed';
      }
    }

    // Pagination
    const total = filtered.length;
    const paginatedRows = filtered.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      employees: paginatedRows,
      summary,
      filingStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error generating SSNIT report:', error);
    return NextResponse.json({ error: 'Failed to generate SSNIT report' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { month, year, employeeIds, filingStatus } = body;

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year are required' }, { status: 400 });
    }

    // Validate that payroll records exist for the period
    const existingRecords = await db.pay_salary.findMany({
      where: { month, year },
      select: { employee_code: true },
    });

    if (existingRecords.length === 0) {
      return NextResponse.json(
        { error: 'No payroll records found for the selected period. Please process payroll first.' },
        { status: 400 }
      );
    }

    // In a real implementation, this would save to an ssnit_filings table
    // For now, update the payroll status to reflect SSNIT filing
    const updateData: Record<string, string> = {};
    if (filingStatus === 'filed') {
      updateData.status = 'filed';
    } else if (filingStatus === 'approved') {
      updateData.status = 'paid';
    }

    if (Object.keys(updateData).length > 0) {
      const empCodes = existingRecords.map((r) => r.employee_code);
      await db.pay_salary.updateMany({
        where: { month, year, employee_code: { in: empCodes } },
        data: updateData,
      });
    }

    return NextResponse.json({
      success: true,
      message: `SSNIT filing ${filingStatus === 'filed' ? 'submitted' : 'approved'} successfully for ${month}/${year}`,
      filingStatus,
      month,
      year,
    });
  } catch (error) {
    console.error('Error submitting SSNIT filing:', error);
    return NextResponse.json({ error: 'Failed to submit SSNIT filing' }, { status: 500 });
  }
}
