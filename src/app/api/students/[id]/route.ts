import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const student = await db.student.findUnique({
      where: { student_id: parseInt(id) },
      include: {
        parent: true,
        enrolls: {
          include: {
            class: true,
            section: true,
          },
          orderBy: { enroll_id: 'desc' },
        },
        invoices: {
          orderBy: { invoice_id: 'desc' },
          take: 20,
        },
        payments: {
          orderBy: { payment_id: 'desc' },
          take: 20,
        },
        attendances: {
          orderBy: { timestamp: 'desc' },
          take: 100,
        },
        terminal_reports: {
          include: {
            class: true,
          },
          orderBy: { report_id: 'desc' },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ student });
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      first_name,
      middle_name,
      last_name,
      sex,
      religion,
      blood_group,
      birthday,
      nationality,
      address,
      phone,
      email,
      admission_date,
      parent_id,
      username,
      special_needs,
      class_reached,
    } = body;

    const name = [first_name, middle_name, last_name].filter(Boolean).join(' ');

    const student = await db.student.update({
      where: { student_id: parseInt(id) },
      data: {
        first_name: first_name || undefined,
        middle_name: middle_name || undefined,
        last_name: last_name || undefined,
        name,
        sex: sex || undefined,
        religion: religion || undefined,
        blood_group: blood_group || undefined,
        birthday: birthday ? new Date(birthday) : undefined,
        nationality: nationality || undefined,
        address: address || undefined,
        phone: phone || undefined,
        email: email || undefined,
        admission_date: admission_date ? new Date(admission_date) : undefined,
        parent_id: parent_id || null,
        username: username || undefined,
        special_needs: special_needs || undefined,
        class_reached: class_reached || undefined,
      },
    });

    return NextResponse.json({ student });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const student = await db.student.update({
      where: { student_id: parseInt(id) },
      data: { active_status: 0 },
    });

    return NextResponse.json({ student });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    );
  }
}
