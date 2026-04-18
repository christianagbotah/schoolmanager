import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId') || '';
    const classId = searchParams.get('classId') || '';

    if (!studentId && !classId) {
      return NextResponse.json({ error: 'studentId or classId is required' }, { status: 400 });
    }

    // Get student IDs
    let studentIds: number[] = [];
    if (studentId) {
      studentIds = [parseInt(studentId)];
    } else if (classId) {
      const enrolls = await db.enroll.findMany({
        where: { class_id: parseInt(classId) },
        select: { student_id: true },
        distinct: ['student_id'],
      });
      studentIds = enrolls.map((e) => e.student_id);
    }

    if (studentIds.length === 0) {
      return NextResponse.json({ students: [], subjects: [], gradeDistribution: {} });
    }

    // Get all marks for these students
    const marks = await db.exam_marks.findMany({
      where: { student_id: { in: studentIds } },
      include: {
        subject: { select: { subject_id: true, name: true } },
      },
      orderBy: { term: 'asc' },
    });

    // Group by subject
    const subjectMap = new Map<number, { name: string; studentScores: Record<number, { terms: string[]; scores: number[] }> }>();
    const studentTermScores = new Map<number, Map<string, number[]>>();

    for (const m of marks) {
      if (!subjectMap.has(m.subject_id)) {
        subjectMap.set(m.subject_id, {
          name: m.subject.name,
          studentScores: {},
        });
      }
      const subjectEntry = subjectMap.get(m.subject_id)!;

      if (!subjectEntry.studentScores[m.student_id]) {
        subjectEntry.studentScores[m.student_id] = { terms: [], scores: [] };
      }
      subjectEntry.studentScores[m.student_id].terms.push(m.term || '');
      subjectEntry.studentScores[m.student_id].scores.push(m.mark_obtained);

      if (!studentTermScores.has(m.student_id)) studentTermScores.set(m.student_id, new Map());
      const termMap = studentTermScores.get(m.student_id)!;
      if (!termMap.has(m.term)) termMap.set(m.term, []);
      termMap.get(m.term)!.push(m.mark_obtained);
    }

    // Get student info
    const students = await db.student.findMany({
      where: { student_id: { in: studentIds } },
      select: { student_id: true, name: true, student_code: true },
    });

    const studentMap = new Map(students.map((s) => [s.student_id, s]));

    // Build subject-wise data for each student
    const subjectList = Array.from(subjectMap.entries()).map(([subjectId, data]) => ({
      subjectId,
      subjectName: data.name,
    }));

    const studentData = students.map((student) => {
      const termAverages: { term: string; average: number }[] = [];
      const termMap = studentTermScores.get(student.student_id);
      if (termMap) {
        for (const [term, scores] of termMap) {
          const avg = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;
          termAverages.push({ term, average: avg });
        }
      }
      termAverages.sort((a, b) => a.term.localeCompare(b.term));

      const subjectScores = subjectList.map((sub) => {
        const data = subjectMap.get(sub.subjectId)!;
        const studentMarks = data.studentScores[student.student_id];
        if (!studentMarks || studentMarks.scores.length === 0) {
          return { subjectId: sub.subjectId, subjectName: sub.subjectName, average: 0, trend: 'none' as const };
        }
        const avg = Math.round((studentMarks.scores.reduce((a, b) => a + b, 0) / studentMarks.scores.length) * 10) / 10;
        // Determine trend
        let trend: 'up' | 'down' | 'stable' | 'none' = 'none';
        if (studentMarks.scores.length >= 2) {
          const firstHalf = studentMarks.scores.slice(0, Math.floor(studentMarks.scores.length / 2));
          const secondHalf = studentMarks.scores.slice(Math.floor(studentMarks.scores.length / 2));
          const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
          const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
          const diff = secondAvg - firstAvg;
          if (diff > 3) trend = 'up';
          else if (diff < -3) trend = 'down';
          else trend = 'stable';
        }
        return { subjectId: sub.subjectId, subjectName: sub.subjectName, average: avg, trend };
      });

      const overallAvg = subjectScores.filter((s) => s.average > 0);
      const cumulativeAvg = overallAvg.length > 0
        ? Math.round((overallAvg.reduce((a, b) => a + b.average, 0) / overallAvg.length) * 10) / 10
        : 0;

      return {
        studentId: student.student_id,
        name: student.name,
        studentCode: student.student_code,
        termAverages,
        subjectScores,
        cumulativeAverage: cumulativeAvg,
      };
    });

    // Grade distribution
    const gradeDistribution: Record<string, number> = {};
    for (const student of studentData) {
      const avg = student.cumulativeAverage;
      let grade = 'F';
      if (avg >= 80) grade = 'A';
      else if (avg >= 70) grade = 'B';
      else if (avg >= 60) grade = 'C';
      else if (avg >= 50) grade = 'D';
      gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
    }

    return NextResponse.json({
      students: studentData,
      subjects: subjectList,
      gradeDistribution,
    });
  } catch (error) {
    console.error('Error fetching cumulative report:', error);
    return NextResponse.json({ error: 'Failed to fetch cumulative report' }, { status: 500 });
  }
}
