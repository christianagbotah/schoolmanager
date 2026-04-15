import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * GET /api/admin/students/promotion
 * Get students eligible for promotion from a class in the current session
 * Matches CI3 Admin::get_students_to_promote
 * 
 * Query params:
 *   fromClassId - source class
 *   toClassId   - target class
 *   runningYear - current academic year
 *   promotionYear - next academic year
 *   term        - current term (1,2,3)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const fromClassId = parseInt(searchParams.get('fromClassId') || '0');
    const toClassId = parseInt(searchParams.get('toClassId') || '0');
    const runningYear = searchParams.get('runningYear') || '';
    const promotionYear = searchParams.get('promotionYear') || '';
    const term = searchParams.get('term') || '';

    if (!fromClassId || !toClassId || !runningYear) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Get class info to determine JHSS vs others
    const fromClass = await db.school_class.findUnique({ where: { class_id: fromClassId } });
    const toClass = await db.school_class.findUnique({ where: { class_id: toClassId } });

    if (!fromClass || !toClass) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Get enrolled students for the source class in the current session
    // JHSS uses sem, others use term
    const enrollWhere: Record<string, unknown> = {
      class_id: fromClassId,
      year: runningYear,
      mute: 0,
    };

    // Try with term or sem based on what's provided
    if (term && !isNaN(parseInt(term))) {
      enrollWhere.term = term;
    }

    const enrolls = await db.enroll.findMany({
      where: enrollWhere,
      include: {
        student: {
          select: {
            student_id: true,
            student_code: true,
            name: true,
            first_name: true,
            last_name: true,
            sex: true,
          },
        },
        section: {
          select: { section_id: true, name: true },
        },
      },
      orderBy: { roll: 'asc' },
    });

    // Check which students already have enrollment in the promotion year
    const promotionEnrolls = await db.enroll.findMany({
      where: {
        year: promotionYear,
        student_id: { in: enrolls.map(e => e.student_id) },
      },
      select: { student_id: true },
    });

    const alreadyEnrolledIds = new Set(promotionEnrolls.map(e => e.student_id));

    // Get target class sections
    const toSections = await db.section.findMany({
      where: { class_id: toClassId },
    });

    const students = enrolls.map(e => ({
      student_id: e.student.student_id,
      student_code: e.student.student_code,
      name: e.student.name,
      sex: e.student.sex,
      section_id: e.section.section_id,
      section_name: e.section.name,
      already_enrolled: alreadyEnrolledIds.has(e.student_id),
    }));

    return NextResponse.json({
      fromClass: { class_id: fromClass.class_id, name: fromClass.name, name_numeric: fromClass.name_numeric, category: fromClass.category },
      toClass: { class_id: toClass.class_id, name: toClass.name, name_numeric: toClass.name_numeric, category: toClass.category },
      toSections,
      students,
      total: students.length,
      alreadyEnrolled: alreadyEnrolledIds.size,
      eligible: students.length - alreadyEnrolledIds.size,
    });
  } catch (error) {
    console.error('Error fetching promotion students:', error);
    return NextResponse.json({ error: 'Failed to fetch promotion data' }, { status: 500 });
  }
}

/**
 * POST /api/admin/students/promotion
 * Promote students by creating new enrollment records
 * Matches CI3 Admin::student_promotion/promote
 * 
 * Body:
 *   fromClassId    - source class
 *   toClassId      - target class
 *   runningYear    - current academic year
 *   promotionYear  - next academic year
 *   term           - current term
 *   promotions     - array of { student_id, target_class_id, section_id }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromClassId, runningYear, promotionYear, term, promotions } = body;

    if (!promotions || !Array.isArray(promotions) || promotions.length === 0) {
      return NextResponse.json({ error: 'No students selected for promotion' }, { status: 400 });
    }

    if (!promotionYear) {
      return NextResponse.json({ error: 'Promotion year is required' }, { status: 400 });
    }

    const promoted: number[] = [];
    const skipped: number[] = [];
    const errors: { student_id: number; error: string }[] = [];

    for (const p of promotions) {
      try {
        const studentId = parseInt(p.student_id);
        const targetClassId = parseInt(p.target_class_id);

        // Check if already enrolled in promotion year
        const existing = await db.enroll.findFirst({
          where: {
            student_id: studentId,
            year: promotionYear,
          },
        });

        if (existing) {
          skipped.push(studentId);
          continue;
        }

        // Get section for the target class
        let sectionId = p.section_id ? parseInt(p.section_id) : null;
        if (!sectionId) {
          const section = await db.section.findFirst({
            where: { class_id: targetClassId },
          });
          sectionId = section ? section.section_id : 0;
        }

        // Get residence_type from current enrollment
        const currentEnroll = await db.enroll.findFirst({
          where: { student_id: studentId, year: runningYear },
          select: { residence_type: true, parent_id: true },
        });

        await db.enroll.create({
          data: {
            student_id: studentId,
            class_id: targetClassId,
            section_id: sectionId,
            year: promotionYear,
            term: term || '',
            residence_type: currentEnroll?.residence_type || 'Day',
            parent_id: currentEnroll?.parent_id || null,
            enroll_code: crypto.randomBytes(4).toString('hex').substring(0, 7),
            mute: 0,
          },
        });

        promoted.push(studentId);
      } catch (e) {
        errors.push({
          student_id: p.student_id,
          error: e instanceof Error ? e.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      promoted: promoted.length,
      skipped: skipped.length,
      errors: errors.length,
      message: `${promoted.length} student(s) promoted successfully. ${skipped.length} already enrolled. ${errors.length} errors.`,
    });
  } catch (error) {
    console.error('Error promoting students:', error);
    return NextResponse.json({ error: 'Failed to promote students' }, { status: 500 });
  }
}
