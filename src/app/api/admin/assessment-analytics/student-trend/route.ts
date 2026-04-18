import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    // Get all marks for this student across exams
    const marks = await db.exam_marks.findMany({
      where: { student_id: parseInt(studentId) },
      include: {
        exam: { select: { exam_id: true, name: true, date: true, class_id: true } },
        subject: { select: { subject_id: true, name: true } },
      },
      orderBy: { exam: { date: 'asc' } },
    });

    if (marks.length === 0) {
      return NextResponse.json({
        student: null,
        examTrend: [],
        gradeProgression: [],
        subjectPerformance: [],
        overallAvg: 0,
        bestSubject: null,
        weakestSubject: null,
      });
    }

    // Get student info
    const student = await db.student.findUnique({
      where: { student_id: parseInt(studentId) },
      select: { student_id: true, name: true, student_code: true },
    });

    // Get grades for grade assignment
    const grades = await db.grade.findMany({ orderBy: { grade_from: 'desc' } });

    function getGrade(score: number): string {
      for (const g of grades) {
        if (score >= g.grade_from && score <= g.grade_to) return g.name;
      }
      return 'N/A';
    }

    // Build exam-by-exam trend
    const examDataMap: Record<number, { name: string; date: string; scores: number[]; subjects: string[] }> = {};
    for (const m of marks) {
      if (!m.exam) continue;
      const eid = m.exam.exam_id;
      if (!examDataMap[eid]) {
        examDataMap[eid] = {
          name: m.exam.name,
          date: m.exam.date?.toISOString().split('T')[0] || '',
          scores: [],
          subjects: [],
        };
      }
      examDataMap[eid].scores.push(m.mark_obtained);
      examDataMap[eid].subjects.push(m.subject?.name || 'Unknown');
    }

    const examTrend = Object.values(examDataMap).map(e => {
      const avg = e.scores.reduce((a, b) => a + b, 0) / e.scores.length;
      return {
        exam: e.name,
        date: e.date,
        avgScore: parseFloat(avg.toFixed(1)),
        highest: parseFloat(Math.max(...e.scores).toFixed(1)),
        lowest: parseFloat(Math.min(...e.scores).toFixed(1)),
        grade: getGrade(avg),
        subjects: e.subjects.length,
        scores: e.scores,
      };
    });

    // Calculate trend indicators
    for (let i = 1; i < examTrend.length; i++) {
      const diff = examTrend[i].avgScore - examTrend[i - 1].avgScore;
      examTrend[i].trend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable';
      examTrend[i].trendValue = parseFloat(Math.abs(diff).toFixed(1));
    }
    if (examTrend.length > 0) {
      examTrend[0].trend = 'stable';
      examTrend[0].trendValue = 0;
    }

    // Grade progression over time
    const gradeProgression = examTrend.map(e => ({
      exam: e.exam,
      date: e.date,
      grade: e.grade,
      avgScore: e.avgScore,
    }));

    // Subject performance breakdown
    const subjectMap: Record<number, { name: string; scores: number[]; grades: string[]; examNames: string[] }> = {};
    for (const m of marks) {
      const sid = m.subject_id;
      if (!subjectMap[sid]) {
        subjectMap[sid] = { name: m.subject?.name || `Subject ${sid}`, scores: [], grades: [], examNames: [] };
      }
      subjectMap[sid].scores.push(m.mark_obtained);
      subjectMap[sid].grades.push(getGrade(m.mark_obtained));
      subjectMap[sid].examNames.push(m.exam?.name || '');
    }

    const subjectPerformance = Object.entries(subjectMap).map(([id, data]) => ({
      subjectId: parseInt(id),
      subjectName: data.name,
      avgScore: parseFloat((data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(1)),
      highest: parseFloat(Math.max(...data.scores).toFixed(1)),
      lowest: parseFloat(Math.min(...data.scores).toFixed(1)),
      latestGrade: data.grades[data.grades.length - 1] || 'N/A',
      totalExams: data.scores.length,
      trend: (() => {
        if (data.scores.length < 2) return 'stable';
        const recent = data.scores.slice(-3);
        const older = data.scores.slice(0, -3);
        if (older.length === 0) return 'stable';
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
        return recentAvg > olderAvg ? 'up' : recentAvg < olderAvg ? 'down' : 'stable';
      })(),
    })).sort((a, b) => b.avgScore - a.avgScore);

    const allScores = marks.map(m => m.mark_obtained);
    const overallAvg = parseFloat((allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1));
    const bestSubject = subjectPerformance.length > 0 ? subjectPerformance[0] : null;
    const weakestSubject = subjectPerformance.length > 0 ? subjectPerformance[subjectPerformance.length - 1] : null;

    return NextResponse.json({
      student,
      examTrend,
      gradeProgression,
      subjectPerformance,
      overallAvg,
      bestSubject,
      weakestSubject,
      totalExams: examTrend.length,
      totalMarks: marks.length,
    });
  } catch (error) {
    console.error('Student trend error:', error);
    return NextResponse.json({ error: 'Failed to fetch student trend' }, { status: 500 });
  }
}
