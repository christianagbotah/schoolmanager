import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { students } = body as { students: Array<Record<string, string>> };

    if (!students || !Array.isArray(students)) {
      return NextResponse.json(
        { error: 'Invalid data format. Expected { students: [...] }' },
        { status: 400 }
      );
    }

    const results: Array<{ row: number; student_code: string; success: boolean; error?: string }> = [];
    const createdStudents: Array<{ student_id: number; student_code: string }> = [];

    for (let i = 0; i < students.length; i++) {
      const row = students[i];
      try {
        const first_name = row.first_name || row.firstName || '';
        const middle_name = row.middle_name || row.middleName || '';
        const last_name = row.last_name || row.lastName || '';
        const name = [first_name, middle_name, last_name].filter(Boolean).join(' ');

        if (!name.trim()) {
          results.push({ row: i + 2, student_code: '', success: false, error: 'Name is required' });
          continue;
        }

        const studentCode = `STU${new Date().getFullYear()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

        const student = await db.student.create({
          data: {
            first_name,
            middle_name,
            last_name,
            name,
            sex: row.sex || row.gender || '',
            religion: row.religion || '',
            blood_group: row.blood_group || row.bloodGroup || '',
            birthday: row.birthday ? new Date(row.birthday) : null,
            nationality: row.nationality || '',
            address: row.address || '',
            phone: row.phone || '',
            email: row.email || '',
            admission_date: row.admission_date ? new Date(row.admission_date) : new Date(),
            student_code: studentCode,
            username: row.username || '',
            password: row.password || '',
            special_needs: row.special_needs || row.specialNeeds || '',
          },
        });

        createdStudents.push({ student_id: student.student_id, student_code: studentCode });
        results.push({ row: i + 2, student_code: studentCode, success: true });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        results.push({ row: i + 2, student_code: '', success: false, error: message });
      }
    }

    return NextResponse.json({
      results,
      total: students.length,
      successCount: createdStudents.length,
      failCount: students.length - createdStudents.length,
    });
  } catch (error) {
    console.error('Error in bulk upload:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk upload' },
      { status: 500 }
    );
  }
}
