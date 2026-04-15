import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * POST /api/admin/students/bulk
 * Bulk add students from CSV upload
 * Matches CI3 Admin::bulk_student_add_using_csv/import
 * 
 * Body: FormData with:
 *   file       - CSV file
 *   class_id   - target class
 *   section_id - target section
 *   year       - academic year
 *   term       - academic term
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const classId = parseInt(formData.get('class_id') as string || '0');
    const sectionId = parseInt(formData.get('section_id') as string || '0');
    const year = (formData.get('year') as string) || new Date().getFullYear().toString();
    const term = (formData.get('term') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!classId || !sectionId) {
      return NextResponse.json({ error: 'Class and section are required' }, { status: 400 });
    }

    // Parse CSV
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file is empty or has no data rows' }, { status: 400 });
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const rows = lines.slice(1);

    // Get class info
    const classInfo = await db.school_class.findUnique({
      where: { class_id: classId },
      select: { name: true, name_numeric: true, category: true },
    });

    const success: number[] = [];
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const line = rows[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, j) => { row[h] = values[j] || ''; });

      try {
        const firstName = (row['first_name'] || '').trim();
        const lastName = (row['last_name'] || '').trim();

        if (!firstName && !lastName) {
          errors.push({ row: i + 2, error: 'Missing first_name and last_name' });
          continue;
        }

        const name = [firstName, row['middle_name'] || '', lastName].filter(Boolean).join(' ').toUpperCase();
        const studentCode = generateStudentCode();

        // Check for duplicate email
        const studentEmail = (row['email'] || '').trim();
        const parentEmail = (row['parent_email'] || (row['guardian_email'] || '')).trim();

        if (studentEmail) {
          const emailExists = await db.student.findFirst({ where: { email: studentEmail } });
          if (emailExists) {
            errors.push({ row: i + 2, error: `Duplicate student email: ${studentEmail}` });
            continue;
          }
        }

        // Create or find parent
        let parentId: number | null = null;
        const parentName = (row['parent_name'] || row['guardian_name'] || '').trim();
        const parentPhone = (row['parent_phone'] || row['guardian_phone'] || '').trim();

        if (parentName) {
          // Try to find existing parent by phone
          let parent = null;
          if (parentPhone) {
            parent = await db.parent.findFirst({ where: { phone: parentPhone } });
          }
          if (!parent && parentEmail) {
            parent = await db.parent.findFirst({ where: { email: parentEmail } });
          }

          if (!parent) {
            parent = await db.parent.create({
              data: {
                name: parentName.toUpperCase(),
                phone: parentPhone || '',
                email: parentEmail || '',
                active_status: 1,
              },
            });
          }
          parentId = parent.parent_id;
        }

        // Create student
        const authKey = crypto.randomBytes(3).toString('hex').substring(0, 5).toUpperCase();

        const student = await db.student.create({
          data: {
            first_name: firstName,
            middle_name: (row['middle_name'] || '').trim(),
            last_name: lastName,
            name,
            sex: (row['sex'] || '').toLowerCase(),
            birthday: row['birthday'] ? new Date(row['birthday']) : null,
            religion: (row['religion'] || '').trim(),
            blood_group: (row['blood_group'] || '').trim(),
            nationality: (row['nationality'] || 'Ghanaian').trim(),
            address: (row['address'] || '').trim(),
            phone: (row['phone'] || '').trim(),
            email: studentEmail,
            parent_id: parentId,
            student_code: studentCode,
            username: studentCode,
            password: '',
            authentication_key: authKey,
            active_status: 1,
            admission_date: new Date(),
            class_reached: classInfo ? `${classInfo.name} ${classInfo.name_numeric}` : '',
          },
        });

        // Create enrollment
        await db.enroll.create({
          data: {
            student_id: student.student_id,
            class_id: classId,
            section_id: sectionId,
            year,
            term,
            parent_id: parentId,
            residence_type: (row['residence_type'] || 'Day').trim(),
            enroll_code: crypto.randomBytes(4).toString('hex').substring(0, 7),
            mute: 0,
          },
        });

        success.push(student.student_id);
      } catch (e) {
        errors.push({
          row: i + 2,
          error: e instanceof Error ? e.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      imported: success.length,
      errors: errors.length,
      total: rows.length,
      errorDetails: errors,
    });
  } catch (error) {
    console.error('Error in bulk student import:', error);
    return NextResponse.json({ error: 'Failed to import students' }, { status: 500 });
  }
}

/**
 * GET /api/admin/students/bulk
 * Generate CSV template for bulk student upload
 * Matches CI3 Admin::generate_bulk_student_csv
 * 
 * Query params:
 *   class_id   - target class
 *   section_id - target section
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const classId = parseInt(searchParams.get('class_id') || '0');
    const sectionId = parseInt(searchParams.get('section_id') || '0');

    if (!classId || !sectionId) {
      return NextResponse.json({ error: 'Class and section are required' }, { status: 400 });
    }

    const classInfo = await db.school_class.findUnique({
      where: { class_id: classId },
    });
    const sectionInfo = await db.section.findUnique({
      where: { section_id: sectionId },
    });

    // CSV template headers
    const headers = [
      'first_name', 'last_name', 'middle_name', 'sex', 'birthday',
      'religion', 'blood_group', 'nationality', 'phone', 'address',
      'parent_name', 'parent_phone', 'parent_email', 'residence_type',
    ];

    // Sample row
    const sample = [
      'Kwame', 'Asante', '', 'male', '2015-03-15',
      'Christian', 'A+', 'Ghanaian', '0240000000', 'Accra',
      'Kofi Asante', '0240000001', 'kofi@example.com', 'Day',
    ];

    const csvContent = [headers.join(','), sample.join(',')].join('\n');
    const filename = `student_template_${classInfo?.name || 'class'}_${sectionInfo?.name || ''}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating CSV template:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}

function generateStudentCode(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `STU${year}${random}`;
}
