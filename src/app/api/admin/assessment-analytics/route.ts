import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'overview';
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const studentId = searchParams.get('studentId');
    const examId = searchParams.get('examId');
    const term = searchParams.get('term');
    const year = searchParams.get('year');

    switch (type) {
      case 'overview':
        return handleOverview(classId, term, year);
      case 'class':
        return handleClassComparison(term, year);
      case 'subject':
        return handleSubjectAnalysis(classId, term, year);
      case 'student':
        return handleStudentPerformance(studentId);
      case 'exam':
        return handleExamAnalysis(examId);
      default:
        return handleOverview(classId, term, year);
    }
  } catch (error) {
    console.error('Assessment analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

// ─── Helper: get grades ────────────────────────────────────────
async function getGrades() {
  return db.grade.findMany({ orderBy: { grade_from: 'desc' } });
}

function getGradeForScore(score: number, grades: { grade_id: number; name: string; grade_from: number; grade_to: number }[]) {
  if (grades.length === 0) return 'N/A';
  for (const g of grades) {
    if (score >= g.grade_from && score <= g.grade_to) return g.name;
  }
  return 'N/A';
}

// ─── OVERVIEW ──────────────────────────────────────────────────
async function handleOverview(classId: string | null, term: string | null, year: string | null) {
  const grades = await getGrades();

  const whereClause: Record<string, unknown> = {};
  if (classId) whereClause.exam = { class_id: parseInt(classId) };
  if (term) whereClause.term = term;
  if (year) whereClause.year = year;

  const allMarks = await db.exam_marks.findMany({
    where: whereClause,
    include: {
      student: { select: { student_id: true, name: true, student_code: true } },
      subject: { select: { subject_id: true, name: true } },
      exam: { select: { exam_id: true, name: true, date: true } },
    },
  });

  if (allMarks.length === 0) {
    return NextResponse.json({
      summary: { avgScore: 0, passRate: 0, distinctionRate: 0, totalExams: 0, totalStudents: 0, totalMarks: 0 },
      gradeDistribution: [],
      topStudents: [],
      examTrend: [],
    });
  }

  const scores = allMarks.map(m => m.mark_obtained);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const passThreshold = 50;
  const passCount = scores.filter(s => s >= passThreshold).length;
  const passRate = (passCount / scores.length) * 100;
  const distinctionThreshold = 80;
  const distinctionCount = scores.filter(s => s >= distinctionThreshold).length;
  const distinctionRate = (distinctionCount / scores.length) * 100;

  // Unique exams
  const uniqueExams = new Set(allMarks.map(m => m.exam_id).filter(Boolean));
  // Unique students
  const uniqueStudents = new Set(allMarks.map(m => m.student_id));

  // Grade distribution
  const gradeDist: Record<string, number> = {};
  for (const m of allMarks) {
    const g = getGradeForScore(m.mark_obtained, grades);
    gradeDist[g] = (gradeDist[g] || 0) + 1;
  }
  const gradeDistribution = Object.entries(gradeDist)
    .map(([grade, count]) => ({ grade, count, percentage: (count / allMarks.length) * 100 }))
    .sort((a, b) => b.count - a.count);

  // Top 10 students by average score
  const studentScores: Record<number, { name: string; student_code: string; scores: number[] }> = {};
  for (const m of allMarks) {
    if (!studentScores[m.student_id]) {
      studentScores[m.student_id] = {
        name: m.student?.name || 'Unknown',
        student_code: m.student?.student_code || '',
        scores: [],
      };
    }
    studentScores[m.student_id].scores.push(m.mark_obtained);
  }
  const topStudents = Object.entries(studentScores)
    .map(([, v]) => ({
      name: v.name,
      student_code: v.student_code,
      avgScore: v.scores.reduce((a, b) => a + b, 0) / v.scores.length,
      totalMarks: v.scores.length,
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 10);

  // Exam trend - average score per exam
  const examScores: Record<number, { name: string; date: Date | null; scores: number[] }> = {};
  for (const m of allMarks) {
    if (!m.exam_id) continue;
    if (!examScores[m.exam_id]) {
      examScores[m.exam_id] = { name: m.exam?.name || 'Unknown', date: m.exam?.date || null, scores: [] };
    }
    examScores[m.exam_id].scores.push(m.mark_obtained);
  }
  const examTrend = Object.entries(examScores)
    .map(([, v]) => ({
      exam: v.name,
      avgScore: parseFloat((v.scores.reduce((a, b) => a + b, 0) / v.scores.length).toFixed(1)),
      date: v.date?.toISOString().split('T')[0] || '',
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-10);

  return NextResponse.json({
    summary: {
      avgScore: parseFloat(avgScore.toFixed(1)),
      passRate: parseFloat(passRate.toFixed(1)),
      distinctionRate: parseFloat(distinctionRate.toFixed(1)),
      totalExams: uniqueExams.size,
      totalStudents: uniqueStudents.size,
      totalMarks: allMarks.length,
    },
    gradeDistribution,
    topStudents,
    examTrend,
  });
}

// ─── CLASS COMPARISON ──────────────────────────────────────────
async function handleClassComparison(term: string | null, year: string | null) {
  const classes = await db.school_class.findMany({ orderBy: { name_numeric: 'asc' } });
  const grades = await getGrades();

  const classStats = await Promise.all(
    classes.map(async (cls) => {
      const whereClause: Record<string, unknown> = { exam: { class_id: cls.class_id } };
      if (term) whereClause.term = term;
      if (year) whereClause.year = year;

      const marks = await db.exam_marks.findMany({
        where: whereClause,
        select: { mark_obtained: true },
      });

      if (marks.length === 0) {
        return {
          classId: cls.class_id,
          className: cls.name,
          avgScore: 0,
          highest: 0,
          lowest: 0,
          passRate: 0,
          totalMarks: 0,
          students: 0,
        };
      }

      const scores = marks.map(m => m.mark_obtained);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const passCount = scores.filter(s => s >= 50).length;

      const uniqueStudents = await db.exam_marks.findMany({
        where: whereClause,
        select: { student_id: true },
        distinct: ['student_id'],
      });

      return {
        classId: cls.class_id,
        className: cls.name,
        avgScore: parseFloat(avg.toFixed(1)),
        highest: parseFloat(Math.max(...scores).toFixed(1)),
        lowest: parseFloat(Math.min(...scores).toFixed(1)),
        passRate: parseFloat(((passCount / scores.length) * 100).toFixed(1)),
        totalMarks: marks.length,
        students: uniqueStudents.length,
      };
    })
  );

  const filteredStats = classStats.filter(c => c.totalMarks > 0);

  return NextResponse.json({ classes: filteredStats });
}

// ─── SUBJECT ANALYSIS ──────────────────────────────────────────
async function handleSubjectAnalysis(classId: string | null, term: string | null, year: string | null) {
  const grades = await getGrades();

  const whereClause: Record<string, unknown> = {};
  if (classId) whereClause.exam = { class_id: parseInt(classId) };
  if (term) whereClause.term = term;
  if (year) whereClause.year = year;

  const allMarks = await db.exam_marks.findMany({
    where: whereClause,
    include: {
      subject: { select: { subject_id: true, name: true } },
    },
  });

  // Group by subject
  const subjectMap: Record<number, { name: string; scores: number[] }> = {};
  for (const m of allMarks) {
    const sid = m.subject_id;
    if (!subjectMap[sid]) {
      subjectMap[sid] = { name: m.subject?.name || `Subject ${sid}`, scores: [] };
    }
    subjectMap[sid].scores.push(m.mark_obtained);
  }

  const subjects = Object.entries(subjectMap).map(([id, data]) => {
    const avg = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
    const passCount = data.scores.filter(s => s >= 50).length;
    const highest = Math.max(...data.scores);
    const lowest = Math.min(...data.scores);

    // Grade distribution for this subject
    const gradeDist: Record<string, number> = {};
    for (const s of data.scores) {
      const g = getGradeForScore(s, grades);
      gradeDist[g] = (gradeDist[g] || 0) + 1;
    }

    return {
      subjectId: parseInt(id),
      subjectName: data.name,
      avgScore: parseFloat(avg.toFixed(1)),
      highest: parseFloat(highest.toFixed(1)),
      lowest: parseFloat(lowest.toFixed(1)),
      passRate: parseFloat(((passCount / data.scores.length) * 100).toFixed(1)),
      totalMarks: data.scores.length,
      gradeDistribution: gradeDist,
    };
  }).sort((a, b) => b.avgScore - a.avgScore);

  const easiest = subjects.length > 0 ? subjects[0] : null;
  const hardest = subjects.length > 0 ? subjects[subjects.length - 1] : null;

  // Build heatmap data: subjects as rows, grade ranges as columns
  const gradeRangeColors: Record<string, string> = {
    'Excellent': 'bg-emerald-500',
    'Good': 'bg-emerald-300',
    'Average': 'bg-amber-400',
    'Below Average': 'bg-amber-600',
    'Poor': 'bg-red-500',
  };

  const heatmapData = subjects.map(s => {
    const maxGradeCount = Math.max(...Object.values(s.gradeDistribution), 1);
    return {
      subjectName: s.subjectName,
      grades: Object.entries(s.gradeDistribution).map(([grade, count]) => ({
        grade,
        count,
        percentage: parseFloat(((count / maxGradeCount) * 100).toFixed(0)),
        color: getHeatmapColor(grade),
      })),
    };
  });

  return NextResponse.json({
    subjects,
    easiest,
    hardest,
    heatmapData,
  });
}

function getHeatmapColor(gradeName: string): string {
  const upper = gradeName.toUpperCase();
  if (upper === 'A' || upper === 'A+') return 'bg-emerald-600';
  if (upper === 'B' || upper === 'B+') return 'bg-emerald-400';
  if (upper === 'C' || upper === 'C+') return 'bg-amber-400';
  if (upper === 'D') return 'bg-amber-600';
  if (upper === 'E' || upper === 'F') return 'bg-red-500';
  return 'bg-slate-300';
}

// ─── STUDENT PERFORMANCE ───────────────────────────────────────
async function handleStudentPerformance(studentId: string | null) {
  if (!studentId) {
    return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
  }

  const marks = await db.exam_marks.findMany({
    where: { student_id: parseInt(studentId) },
    include: {
      subject: { select: { subject_id: true, name: true } },
      exam: { select: { exam_id: true, name: true, date: true } },
    },
    orderBy: { exam: { date: 'asc' } },
  });

  if (marks.length === 0) {
    return NextResponse.json({ student: null, subjectBreakdown: [], overallAvg: 0, trend: [] });
  }

  // Get student info
  const student = await db.student.findUnique({
    where: { student_id: parseInt(studentId) },
    select: { student_id: true, name: true, student_code: true },
  });

  // Subject breakdown
  const subjectMap: Record<number, { name: string; scores: number[] }> = {};
  for (const m of marks) {
    const sid = m.subject_id;
    if (!subjectMap[sid]) {
      subjectMap[sid] = { name: m.subject?.name || `Subject ${sid}`, scores: [] };
    }
    subjectMap[sid].scores.push(m.mark_obtained);
  }

  const subjectBreakdown = Object.entries(subjectMap).map(([id, data]) => ({
    subjectId: parseInt(id),
    subjectName: data.name,
    avgScore: parseFloat((data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(1)),
    highest: parseFloat(Math.max(...data.scores).toFixed(1)),
    lowest: parseFloat(Math.min(...data.scores).toFixed(1)),
    totalExams: data.scores.length,
  })).sort((a, b) => b.avgScore - a.avgScore);

  const allScores = marks.map(m => m.mark_obtained);
  const overallAvg = parseFloat((allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1));

  return NextResponse.json({
    student,
    subjectBreakdown,
    overallAvg,
    totalMarks: marks.length,
  });
}

// ─── EXAM ANALYSIS ─────────────────────────────────────────────
async function handleExamAnalysis(examId: string | null) {
  if (!examId) {
    // Return list of exams
    const exams = await db.exam.findMany({
      orderBy: { date: 'desc' },
      take: 50,
      include: {
        class: { select: { class_id: true, name: true } },
      },
    });
    const examList = exams.map(e => ({
      examId: e.exam_id,
      name: e.name,
      date: e.date?.toISOString().split('T')[0] || '',
      className: e.class?.name || '',
    }));

    return NextResponse.json({ exams: examList });
  }

  const marks = await db.exam_marks.findMany({
    where: { exam_id: parseInt(examId) },
    include: {
      student: { select: { student_id: true, name: true, student_code: true } },
      subject: { select: { subject_id: true, name: true } },
    },
  });

  if (marks.length === 0) {
    return NextResponse.json({
      exam: null,
      scoreDistribution: [],
      subjectAverages: [],
      passFailRatio: { pass: 0, fail: 0, passRate: 0 },
      avgScore: 0,
      totalStudents: 0,
    });
  }

  const exam = await db.exam.findUnique({
    where: { exam_id: parseInt(examId) },
    select: { exam_id: true, name: true, date: true },
  });

  const scores = marks.map(m => m.mark_obtained);
  const avgScore = parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));

  // Score distribution histogram
  const ranges = [
    { label: '0-20', min: 0, max: 20 },
    { label: '21-40', min: 21, max: 40 },
    { label: '41-60', min: 41, max: 60 },
    { label: '61-80', min: 61, max: 80 },
    { label: '81-100', min: 81, max: 100 },
  ];
  const scoreDistribution = ranges.map(r => ({
    range: r.label,
    count: scores.filter(s => s >= r.min && s <= r.max).length,
    percentage: parseFloat(((scores.filter(s => s >= r.min && s <= r.max).length / scores.length) * 100).toFixed(1)),
  }));

  // Average by subject
  const subjectMap: Record<number, { name: string; scores: number[] }> = {};
  for (const m of marks) {
    const sid = m.subject_id;
    if (!subjectMap[sid]) {
      subjectMap[sid] = { name: m.subject?.name || `Subject ${sid}`, scores: [] };
    }
    subjectMap[sid].scores.push(m.mark_obtained);
  }
  const subjectAverages = Object.entries(subjectMap).map(([id, data]) => ({
    subjectId: parseInt(id),
    subjectName: data.name,
    avgScore: parseFloat((data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(1)),
    totalMarks: data.scores.length,
  })).sort((a, b) => b.avgScore - a.avgScore);

  // Pass/fail ratio
  const passCount = scores.filter(s => s >= 50).length;
  const failCount = scores.length - passCount;
  const passFailRatio = {
    pass: passCount,
    fail: failCount,
    passRate: parseFloat(((passCount / scores.length) * 100).toFixed(1)),
  };

  // Unique students
  const uniqueStudents = new Set(marks.map(m => m.student_id));

  return NextResponse.json({
    exam,
    scoreDistribution,
    subjectAverages,
    passFailRatio,
    avgScore,
    totalStudents: uniqueStudents.size,
    totalMarks: marks.length,
  });
}
