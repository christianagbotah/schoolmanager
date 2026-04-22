import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/students/bulk-marksheet
 * Bulk marksheet: returns all students in a class × subjects with marks, totals, grades, positions.
 * Matches CI3 student_marksheet_bulk_print_view
 *
 * Query params:
 *   class_id  - class to view (required)
 *   section_id - section filter (optional)
 *   exam_id   - exam filter (required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const classId = parseInt(searchParams.get('class_id') || '0');
    const sectionId = parseInt(searchParams.get('section_id') || '0');
    const examId = parseInt(searchParams.get('exam_id') || '0');

    if (!classId || !examId) {
      return NextResponse.json({ error: 'class_id and exam_id are required' }, { status: 400 });
    }

    // Get class info
    const classInfo = await db.school_class.findUnique({
      where: { class_id: classId },
      select: { class_id: true, name: true, name_numeric: true, category: true, section_id: true },
    });
    if (!classInfo) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Get section info
    const sectionInfo = sectionId ? await db.section.findUnique({
      where: { section_id },
      select: { section_id: true, name: true },
    }) : await db.section.findFirst({
      where: { class_id: classId },
      select: { section_id: true, name: true },
    });

    // Get exam info
    const examInfo = await db.exam.findUnique({
      where: { exam_id: examId },
      select: { exam_id: true, name: true, date: true, year: true, term: true, sem: true, type: true },
    });

    // Get grades
    const grades = await db.grade.findMany({ orderBy: { grade_from: 'desc' } });
    const getGrade = (score: number) => {
      for (const g of grades) {
        if (score >= g.grade_from && score <= g.grade_to) return g.name;
      }
      return 'F';
    };

    // Get enrolled students for this class
    const enrollWhere: Record<string, unknown> = {
      class_id: classId,
      mute: 0,
    };
    if (sectionId) enrollWhere.section_id = sectionId;

    const enrolls = await db.enroll.findMany({
      where: enrollWhere,
      include: {
        student: {
          select: {
            student_id: true,
            student_code: true,
            name: true,
            sex: true,
          },
        },
        section: {
          select: { section_id: true, name: true },
        },
      },
      orderBy: [{ roll: 'asc' }, { student: { name: 'asc' } }],
    });

    // Get subjects for this class
    const subjects = await db.subject.findMany({
      where: { class_id: classId, status: 1 },
      orderBy: { name: 'asc' },
      select: { subject_id: true, name: true },
    });

    // Get all marks for this exam and class
    const marksWhere: Record<string, unknown> = {
      exam_id: examId,
      class_id: classId,
    };
    if (sectionId) marksWhere.section_id = sectionId;

    const allMarks = await db.mark.findMany({
      where: marksWhere,
      select: {
        student_id: true,
        subject_id: true,
        mark_obtained: true,
        exam_score: true,
        class_score: true,
        term_exam: true,
        sub_total: true,
      },
    });

    // Build a lookup: studentId -> subjectId -> mark
    const markMap = new Map<number, Map<number, { mark_obtained: number; exam_score: number; class_score: number; term_exam: number; sub_total: number }>>();
    for (const m of allMarks) {
      if (!markMap.has(m.student_id)) markMap.set(m.student_id, new Map());
      markMap.get(m.student_id)!.set(m.subject_id, {
        mark_obtained: m.mark_obtained,
        exam_score: m.exam_score,
        class_score: m.class_score,
        term_exam: m.term_exam,
        sub_total: m.sub_total,
      });
    }

    // Build the marksheet rows
    interface MarksheetRow {
      student_id: number;
      student_code: string;
      name: string;
      sex: string;
      section_name: string;
      roll: string;
      marks: { subject_id: number; subject_name: string; mark_obtained: number; grade: string }[];
      total: number;
      subjects_taken: number;
      average: number;
      grade: string;
      position: number;
    }

    const rows: MarksheetRow[] = enrolls.map(e => {
      const studentMarkMap = markMap.get(e.student_id) || new Map();
      const marks = subjects.map(s => {
        const m = studentMarkMap.get(s.subject_id);
        const score = m ? m.mark_obtained : 0;
        return {
          subject_id: s.subject_id,
          subject_name: s.name,
          mark_obtained: score,
          grade: getGrade(score),
        };
      });

      const scored = marks.filter(m => m.mark_obtained > 0);
      const total = scored.reduce((sum, m) => sum + m.mark_obtained, 0);
      const average = scored.length > 0 ? total / scored.length : 0;

      return {
        student_id: e.student.student_id,
        student_code: e.student.student_code,
        name: e.student.name,
        sex: e.student.sex,
        section_name: e.section?.name || sectionInfo?.name || '',
        roll: e.roll || '',
        marks,
        total,
        subjects_taken: scored.length,
        average,
        grade: getGrade(average),
        position: 0,
      };
    });

    // Calculate positions based on total score (descending)
    const sortedByTotal = [...rows].sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.name.localeCompare(b.name);
    });
    sortedByTotal.forEach((row, idx) => {
      row.position = idx + 1;
    });
    // Apply positions back to the original array
    const posMap = new Map(sortedByTotal.map((r, i) => [r.student_id, i + 1]));
    rows.forEach(r => { r.position = posMap.get(r.student_id) || 0; });

    // Get available exams for this class (for the dropdown)
    const availableExams = await db.exam.findMany({
      where: { class_id: classId },
      select: { exam_id: true, name: true, date: true, year: true, term: true, sem: true, type: true },
      orderBy: { date: 'desc' },
    });

    // Get all classes grouped for dropdown
    const classes = await db.school_class.findMany({
      select: { class_id: true, name: true, name_numeric: true, category: true },
      orderBy: [{ category: 'asc' }, { name_numeric: 'asc' }],
    });

    // Get sections for this class
    const sections = await db.section.findMany({
      where: { class_id: classId },
      select: { section_id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      class: classInfo,
      section: sectionInfo || null,
      exam: examInfo,
      subjects,
      students: rows,
      totalStudents: rows.length,
      classes,
      sections,
      availableExams,
      summary: {
        highestScore: rows.length > 0 ? Math.max(...rows.map(r => r.total)) : 0,
        classAverage: rows.length > 0 ? (rows.reduce((s, r) => s + r.average, 0) / rows.length).toFixed(1) : '0',
        studentsAboveAverage: rows.filter(r => r.average >= 50).length,
        totalSubjects: subjects.length,
      },
    });
  } catch (error) {
    console.error('Error fetching bulk marksheet:', error);
    return NextResponse.json({ error: 'Failed to fetch bulk marksheet' }, { status: 500 });
  }
}
