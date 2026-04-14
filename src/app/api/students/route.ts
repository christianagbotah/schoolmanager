import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const classId = searchParams.get('classId') || '';
    const sectionId = searchParams.get('sectionId') || '';
    const gender = searchParams.get('gender') || '';
    const status = searchParams.get('status') || '';

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { student_code: { contains: search } },
        { first_name: { contains: search } },
        { last_name: { contains: search } },
      ];
    }

    if (classId) {
      where.enrolls = {
        some: {
          class_id: parseInt(classId),
        },
      };
    }

    if (sectionId) {
      where.enrolls = {
        ...(where.enrolls as Record<string, unknown> || {}),
        some: {
          ...(typeof where.enrolls === 'object' && 'some' in (where.enrolls as Record<string, unknown>)
            ? (where.enrolls as Record<string, Record<string, unknown>>).some
            : {}),
          section_id: parseInt(sectionId),
        },
      };
    }

    if (gender) {
      where.sex = gender;
    }

    if (status !== '') {
      where.active_status = status === 'active' ? 1 : 0;
    }

    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      db.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { student_id: 'desc' },
        include: {
          parent: {
            select: {
              parent_id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          enrolls: {
            where: {
              year: new Date().getFullYear().toString(),
            },
            include: {
              class: {
                select: {
                  class_id: true,
                  name: true,
                },
              },
              section: {
                select: {
                  section_id: true,
                  name: true,
                },
              },
            },
            take: 1,
          },
        },
      }),
      db.student.count({ where }),
    ]);

    return NextResponse.json({
      students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
      class_id,
      section_id,
      year,
      term,
      roll,
      username,
      password,
      special_needs,
    } = body;

    const name = [first_name, middle_name, last_name].filter(Boolean).join(' ');

    const student = await db.student.create({
      data: {
        first_name: first_name || '',
        middle_name: middle_name || '',
        last_name: last_name || '',
        name,
        sex: sex || '',
        religion: religion || '',
        blood_group: blood_group || '',
        birthday: birthday ? new Date(birthday) : null,
        nationality: nationality || '',
        address: address || '',
        phone: phone || '',
        email: email || '',
        admission_date: admission_date ? new Date(admission_date) : new Date(),
        parent_id: parent_id || null,
        username: username || '',
        password: password || '',
        special_needs: special_needs || '',
        student_code: generateStudentCode(),
      },
    });

    if (class_id && section_id) {
      await db.enroll.create({
        data: {
          student_id: student.student_id,
          class_id: parseInt(class_id),
          section_id: parseInt(section_id),
          year: year || new Date().getFullYear().toString(),
          term: term || '',
          roll: roll || '',
        },
      });
    }

    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
}

function generateStudentCode(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `STU${year}${random}`;
}
