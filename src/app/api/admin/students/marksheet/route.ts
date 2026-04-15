import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/students/marksheet
 * Get marksheet data for a student
 * Matches CI3 student_marksheet.php - shows subjects, class score, exam score, total, grade, position
 * 
 * Query params:
 *   student_id - student to view
 *   exam_id    - exam to filter
 *   class_id   - class filter (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const studentId = parseInt(searchParams.get('student_id') || '0');
    const examId = parseInt(searchParams.get('exam_id') || '0');
    const classId = parseInt(searchParams.get('class_id') || '0');

    if (!studentId) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
    }

    // Get student info
    const student = await db.student.findUnique({
      where: { student_id: studentId },
      select: {
        student_id: true,
        student_code: true,
        name: true,
        first_name: true,
        last_name: true,
        sex: true,
        birthday: true,
        parent: {
          select: { parent_id: true, name: true, phone: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get grades for lookup
    const grades = await db.grade.findMany({
      orderBy: { grade_from: 'desc' },
    });

    const getGrade = (score: number) => {
      for (const g of grades) {
        if (score >= g.grade_from && score <= g.grade_to) {
          return { name: g.name, comment: g.comment };
        }
      }
      return { name: 'F', comment: 'Fail' };
    };

    // Get class and section from enrollment or from query param
    let effectiveClassId = classId;
    let sectionId = 0;
    let className = '';
    let sectionName = '';

    if (effectiveClassId) {
      const classInfo = await db.school_class.findUnique({
        where: { class_id: effectiveClassId },
        select: { name: true, name_numeric: true, category: true },
      });
      className = classInfo ? `${classInfo.name} ${classInfo.name_numeric}` : '';

      const sectionInfo = await db.section.findFirst({
        where: { class_id: effectiveClassId },
      });
      if (sectionInfo) {
        sectionId = sectionInfo.section_id;
        sectionName = sectionInfo.name;
      }
    } else {
      // Get latest enrollment
      const enroll = await db.enroll.findFirst({
        where: { student_id: studentId },
        orderBy: { enroll_id: 'desc' },
        include: {
          class: { select: { name: true, name_numeric: true, category: true } },
          section: { select: { name: true } },
        },
      });
      if (enroll) {
        effectiveClassId = enroll.class_id;
        sectionId = enroll.section_id;
        className = `${enroll.class.name} ${enroll.class.name_numeric}`;
        sectionName = enroll.section.name;
      }
    }

    // Get exam info
    let examInfo = null;
    if (examId) {
      examInfo = await db.exam.findUnique({
        where: { exam_id: examId },
        select: { exam_id: true, name: true, date: true, year: true, type: true },
      });
    }

    // Get subjects for the class
    const subjects = effectiveClassId ? await db.subject.findMany({
      where: { class_id: effectiveClassId, status: 1 },
      orderBy: { name: 'asc' },
    }) : [];

    // Get marks for the student
    const markWhere: Record<string, unknown> = {
      student_id: studentId,
    };
    if (examId) markWhere.exam_id = examId;
    if (effectiveClassId) markWhere.class_id = effectiveClassId;

    const marks = await db.mark.findMany({
      where: markWhere,
      include: {
        subject: {
          select: { subject_id: true, name: true },
        },
      },
    });

    // Build marksheet: for each subject, get the mark
    const marksheet: Array<{
      subject_id: number;
      subject_name: string;
      mark_obtained: number;
      grade_name: string;
      grade_comment: string;
      remark: string;
      position: number;
    }> = [];

    let totalScore = 0;
    let subjectsScored = 0;

    for (const subject of subjects) {
      const mark = marks.find(m => m.subject_id === subject.subject_id);
      const score = mark ? mark.mark_obtained : 0;
      const grade = getGrade(score);

      marksheet.push({
        subject_id: subject.subject_id,
        subject_name: subject.name,
        mark_obtained: score,
        grade_name: grade.name,
        grade_comment: grade.comment,
        remark: score >= 50 ? 'Credit' : 'Fail',
        position: 0, // will be calculated
      });

      if (mark) {
        totalScore += score;
        subjectsScored++;
      }
    }

    // Calculate positions per subject (among all students in class)
    for (const item of marksheet) {
      const allMarksForSubject = await db.mark.findMany({
        where: {
          subject_id: item.subject_id,
          exam_id: examId || undefined,
          class_id: effectiveClassId || undefined,
        },
        orderBy: { mark_obtained: 'desc' },
      });

      const position = allMarksForSubject.findIndex(m => m.student_id === studentId) + 1;
      item.position = position > 0 ? position : 0;
    }

    // Get other students in class (for student list dropdown)
    const otherStudents = effectiveClassId ? await db.enroll.findMany({
      where: {
        class_id: effectiveClassId,
        mute: 0,
        student_id: { not: studentId },
      },
      include: {
        student: {
          select: { student_id: true, name: true },
        },
      },
      take: 50,
      orderBy: { roll: 'asc' },
    }) : [];

    // Get available exams
    const availableExams = effectiveClassId ? await db.exam.findMany({
      where: { class_id: effectiveClassId },
      select: { exam_id: true, name: true, year: true, type: true, date: true },
      orderBy: { date: 'desc' },
    }) : [];

    return NextResponse.json({
      student,
      class: { class_id: effectiveClassId, name: className, section_name: sectionName },
      exam: examInfo,
      subjects: marksheet,
      totalScore,
      subjectsScored,
      subjectsTotal: subjects.length,
      average: subjectsScored > 0 ? (totalScore / subjectsScored) : 0,
      overallGrade: getGrade(subjectsScored > 0 ? totalScore / subjectsScored : 0),
      otherStudents: otherStudents.map(e => ({
        student_id: e.student.student_id,
        name: e.student.name,
      })),
      availableExams,
    });
  } catch (error) {
    console.error('Error fetching marksheet:', error);
    return NextResponse.json({ error: 'Failed to fetch marksheet data' }, { status: 500 });
  }
}
