import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const term = searchParams.get('term') || '';
    const classId = searchParams.get('classId') || '';
    const year = searchParams.get('year') || '';

    if (!classId) {
      return NextResponse.json({ error: 'classId is required' }, { status: 400 });
    }

    // Get enrolled students
    const enrolls = await db.enroll.findMany({
      where: {
        class_id: parseInt(classId),
        ...(term ? { term } : {}),
        ...(year ? { year } : {}),
      },
      select: { student_id: true },
      distinct: ['student_id'],
    });

    const studentIds = enrolls.map((e) => e.student_id);

    // Get subjects for the class
    const subjects = await db.subject.findMany({
      where: { class_id: parseInt(classId) },
      select: { subject_id: true, name: true },
    });

    // Get exam marks
    const marksWhere: Record<string, unknown> = {
      student_id: { in: studentIds },
    };
    if (term) marksWhere.term = term;
    if (year) marksWhere.year = year;

    const marks = await db.exam_marks.findMany({
      where: marksWhere,
      select: { student_id: true, subject_id: true, mark_obtained: true, term: true, year: true },
    });

    // Class average per subject
    const subjectAverages: { subjectId: number; subjectName: string; average: number; highest: number; lowest: number; passRate: number; totalStudents: number; passedCount: number }[] = [];

    for (const subject of subjects) {
      const subjectMarks = marks.filter((m) => m.subject_id === subject.subject_id);
      const uniqueStudents = new Set(subjectMarks.map((m) => m.student_id));
      const scores = subjectMarks.map((m) => m.mark_obtained);

      const total = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) : 0;
      const count = scores.length || 1;
      const average = Math.round((total / count) * 10) / 10;
      const highest = scores.length > 0 ? Math.max(...scores) : 0;
      const lowest = scores.length > 0 ? Math.min(...scores) : 0;

      // Pass rate (50% threshold)
      const passedCount = scores.filter((s) => s >= 50).length;
      const passRate = scores.length > 0 ? Math.round((passedCount / scores.length) * 100) : 0;

      subjectAverages.push({
        subjectId: subject.subject_id,
        subjectName: subject.name,
        average,
        highest,
        lowest,
        passRate,
        totalStudents: uniqueStudents.size,
        passedCount,
      });
    }

    // Student rankings
    const studentScores: Record<number, { total: number; subjectCount: number; subjects: Record<number, number> }> = {};
    for (const m of marks) {
      if (!studentScores[m.student_id]) studentScores[m.student_id] = { total: 0, subjectCount: 0, subjects: {} };
      studentScores[m.student_id].subjects[m.subject_id] = m.mark_obtained;
      studentScores[m.student_id].total += m.mark_obtained;
      studentScores[m.student_id].subjectCount++;
    }

    const rankings = Object.entries(studentScores)
      .map(([sid, data]) => ({
        studentId: parseInt(sid),
        average: data.subjectCount > 0 ? Math.round((data.total / data.subjectCount) * 10) / 10 : 0,
        total: data.total,
        subjects: data.subjects,
      }))
      .sort((a, b) => b.average - a.average);

    const rankedStudentIds = rankings.map((r) => r.studentId);
    const students = rankedStudentIds.length > 0
      ? await db.student.findMany({
          where: { student_id: { in: rankedStudentIds } },
          select: { student_id: true, name: true, student_code: true },
        })
      : [];

    const studentMap = new Map(students.map((s) => [s.student_id, s]));

    const studentRankings = rankings.map((r, idx) => {
      const student = studentMap.get(r.studentId);
      const subjectDetails = subjects.map((sub) => ({
        subjectId: sub.subject_id,
        subjectName: sub.name,
        score: r.subjects[sub.subject_id] || 0,
      }));
      return {
        rank: idx + 1,
        studentId: r.studentId,
        name: student?.name || 'Unknown',
        studentCode: student?.student_code || '',
        average: r.average,
        total: r.total,
        subjects: subjectDetails,
      };
    });

    // Class info
    const classData = await db.school_class.findUnique({
      where: { class_id: parseInt(classId) },
      select: { name: true, name_numeric: true },
    });

    // Overall class stats
    const allAvgs = rankings.map((r) => r.average);
    const classAverage = allAvgs.length > 0
      ? Math.round((allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length) * 10) / 10
      : 0;
    const overallPassRate = subjectAverages.length > 0
      ? Math.round(subjectAverages.reduce((s, sub) => s + sub.passRate, 0) / subjectAverages.length)
      : 0;

    return NextResponse.json({
      classInfo: classData || { name: 'Unknown', name_numeric: 0 },
      term,
      year,
      classAverage,
      overallPassRate,
      subjectAverages,
      studentRankings,
      totalStudents: studentIds.length,
    });
  } catch (error) {
    console.error('Error fetching termly report:', error);
    return NextResponse.json({ error: 'Failed to fetch termly report' }, { status: 500 });
  }
}
