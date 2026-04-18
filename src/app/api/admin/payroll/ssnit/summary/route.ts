import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

const SSNIT_EMPLOYEE_RATE = 0.055;
const SSNIT_EMPLOYER_RATE = 0.08;
const SSNIT_TOTAL_RATE = 0.135;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || String(new Date().getFullYear());

    // Fetch all active employees
    const employees = await db.employee.findMany({
      where: { active_status: 1 },
      select: {
        id: true,
        emp_id: true,
        salary: true,
        hire_date: true,
      },
    });

    // Fetch all payroll records for the selected year
    const payrollRecords = await db.pay_salary.findMany({
      where: { year },
      select: {
        employee_code: true,
        month: true,
        year: true,
        basic_salary: true,
        gross_salary: true,
        status: true,
      },
    });

    // Group payroll by month
    const payrollByMonth = new Map<string, { basic_salary: number; gross_salary: number; status: string }[]>();
    for (const pr of payrollRecords) {
      const key = pr.month;
      if (!payrollByMonth.has(key)) {
        payrollByMonth.set(key, []);
      }
      payrollByMonth.get(key)!.push({
        basic_salary: pr.basic_salary,
        gross_salary: pr.gross_salary,
        status: pr.status,
      });
    }

    // Build monthly summary
    const monthlyData: Array<{
      month: string;
      monthName: string;
      monthNum: number;
      totalEmployees: number;
      totalGross: number;
      employeeDeductions: number;
      employerContributions: number;
      totalContributions: number;
      filingStatus: string;
    }> = [];

    for (let m = 1; m <= 12; m++) {
      const monthStr = String(m);
      const records = payrollByMonth.get(monthStr) || [];

      const processedRecords = records.filter(
        (r) => r.status === 'processed' || r.status === 'paid'
      );
      const totalGross = processedRecords.reduce((s, r) => s + r.gross_salary, 0);
      const totalBasic = processedRecords.reduce((s, r) => s + r.basic_salary, 0);
      const employeeDeductions = Math.round(totalBasic * SSNIT_EMPLOYEE_RATE * 100) / 100;
      const employerContributions = Math.round(totalBasic * SSNIT_EMPLOYER_RATE * 100) / 100;
      const totalContributions = Math.round(totalBasic * SSNIT_TOTAL_RATE * 100) / 100;

      // Determine filing status
      let filingStatus = 'none';
      if (processedRecords.length > 0) {
        filingStatus = 'draft';
        if (processedRecords.every((r) => r.status === 'paid')) {
          filingStatus = 'approved';
        } else if (processedRecords.some((r) => r.status === 'filed' || r.status === 'paid')) {
          filingStatus = 'filed';
        }
      }

      monthlyData.push({
        month: monthStr,
        monthName: MONTHS[m - 1],
        monthNum: m,
        totalEmployees: processedRecords.length,
        totalGross: Math.round(totalGross * 100) / 100,
        employeeDeductions,
        employerContributions,
        totalContributions,
        filingStatus,
      });
    }

    // Annual totals
    const annualTotals = {
      totalEmployees: monthlyData.reduce((s, m) => s + m.totalEmployees, 0),
      totalGross: Math.round(monthlyData.reduce((s, m) => s + m.totalGross, 0) * 100) / 100,
      employeeDeductions: Math.round(monthlyData.reduce((s, m) => s + m.employeeDeductions, 0) * 100) / 100,
      employerContributions: Math.round(monthlyData.reduce((s, m) => s + m.employerContributions, 0) * 100) / 100,
      totalContributions: Math.round(monthlyData.reduce((s, m) => s + m.totalContributions, 0) * 100) / 100,
    };

    // Year-over-year data (previous year comparison)
    const prevYear = String(parseInt(year) - 1);
    const prevPayrollRecords = await db.pay_salary.findMany({
      where: { year: prevYear },
      select: {
        month: true,
        basic_salary: true,
        gross_salary: true,
        status: true,
      },
    });

    const prevPayrollByMonth = new Map<string, { basic_salary: number; status: string }[]>();
    for (const pr of prevPayrollRecords) {
      const key = pr.month;
      if (!prevPayrollByMonth.has(key)) {
        prevPayrollByMonth.set(key, []);
      }
      prevPayrollByMonth.get(key)!.push({
        basic_salary: pr.basic_salary,
        status: pr.status,
      });
    }

    const prevYearMonthly: Array<{ month: string; totalContributions: number }> = [];
    for (let m = 1; m <= 12; m++) {
      const records = prevPayrollByMonth.get(String(m)) || [];
      const processedRecords = records.filter(
        (r) => r.status === 'processed' || r.status === 'paid'
      );
      const totalBasic = processedRecords.reduce((s, r) => s + r.basic_salary, 0);
      const totalContributions = Math.round(totalBasic * SSNIT_TOTAL_RATE * 100) / 100;
      prevYearMonthly.push({
        month: String(m),
        totalContributions,
      });
    }

    const prevYearTotal = Math.round(prevYearMonthly.reduce((s, m) => s + m.totalContributions, 0) * 100) / 100;

    return NextResponse.json({
      year,
      monthlyData,
      annualTotals,
      previousYear: {
        year: prevYear,
        monthlyData: prevYearMonthly,
        totalContributions: prevYearTotal,
      },
    });
  } catch (error) {
    console.error('Error generating SSNIT summary:', error);
    return NextResponse.json({ error: 'Failed to generate SSNIT summary' }, { status: 500 });
  }
}
