import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// ─── Helper: get grades ─────────────────────────────────────────
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

// ─── SBA Component Weights ──────────────────────────────────────
const SBA_WEIGHTS = {
  classwork: { label: 'Classwork', weight: 20, color: '#10b981' },
  homework: { label: 'Homework', weight: 15, color: '#3b82f6' },
  tests: { label: 'Tests', weight: 25, color: '#f59e0b' },
  projects: { label: 'Projects', weight: 15, color: '#8b5cf6' },
  quizzes: { label: 'Quizzes', weight: 10, color: '#ec4899' },
  exam: { label: 'Exam', weight: 15, color: '#ef4444' },
} as const;

type SBACategory = keyof typeof SBA_WEIGHTS;

// Map strand categories to SBA components
function mapStrandToCategory(strandName: string): SBACategory {
  const lower = strandName.toLowerCase();
  if (lower.includes('class') || lower.includes('practice') || lower.includes('participation')) return 'classwork';
  if (lower.includes('home') || lower.includes('assignment') || lower.includes('homework')) return 'homework';
  if (lower.includes('test') || lower.includes('assessment') || lower.includes('evaluation')) return 'tests';
  if (lower.includes('project') || lower.includes('creative') || lower.includes('research')) return 'projects';
  if (lower.includes('quiz') || lower.includes('oral') || lower.includes('presentation')) return 'quizzes';
  return 'tests'; // default
}

// ─── GET: Single portfolio detail ───────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const studentId = parseInt(id);

    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
    }

    // Get student info
    const student = await db.student.findUnique({
      where: { student_id: studentId },
      select: {
        student_id: true,
        student_code: true,
        name: true,
        first_name: true,
        middle_name: true,
        last_name: true,
        sex: true,
        birthday: true,
        admission_date: true,
        phone: true,
        email: true,
        address: true,
        active_status: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get latest enrollment
    const enrollment = await db.enroll.findFirst({
      where: { student_id: studentId },
      orderBy: { enroll_id: 'desc' },
      include: {
        class: { select: { class_id: true, name: true, name_numeric: true, category: true } },
        section: { select: { section_id: true, name: true } },
      },
    });

    // Get all portfolio scores for this student
    const portfolioScores = await db.portfolioScores.findMany({
      where: { student_id: studentId },
      include: {
        header: {
          include: {
            class: { select: { class_id: true, name: true } },
            subject: { select: { subject_id: true, name: true } },
            strand: { select: { strand_id: true, strand_name: true } },
            sub_strand: { select: { sub_strand_id: true, sub_strand_name: true } },
            indicator: { select: { indicator_id: true, indicator_text: true } },
          },
        },
      },
      orderBy: { score_id: 'asc' },
    });

    // Get exam marks for exam component
    const examMarks = await db.examMarks.findMany({
      where: { student_id: studentId },
      include: {
        subject: { select: { subject_id: true, name: true } },
        exam: { select: { exam_id: true, name: true, date: true } },
      },
    });

    const grades = await getGrades();

    // Get all available terms
    const allTerms = await db.terms.findMany({ select: { term_id: true, name: true } });

    // Group portfolio scores by subject
    const subjectMap = new Map<number, {
      subject_id: number;
      subject_name: string;
      assessments: {
        score_id: number;
        header_id: number;
        strand_name: string;
        sub_strand_name: string;
        indicator_text: string;
        score: number;
        max_score: number;
        remarks: string;
        assessment_date: string | null;
        category: SBACategory;
        term: string;
        year: string;
      }[];
      sbaComponents: Record<SBACategory, { totalScore: number; maxScore: number; count: number }>;
      totalScore: number;
      totalMax: number;
      weightedScore: number;
      grade: string;
      teacherRemarks: string[];
    }>();

    for (const ps of portfolioScores) {
      const h = ps.header;
      if (!h) continue;

      const subjectId = h.subject_id || 0;
      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          subject_id: subjectId,
          subject_name: h.subject?.name || `Subject ${subjectId}`,
          assessments: [],
          sbaComponents: {
            classwork: { totalScore: 0, maxScore: 0, count: 0 },
            homework: { totalScore: 0, maxScore: 0, count: 0 },
            tests: { totalScore: 0, maxScore: 0, count: 0 },
            projects: { totalScore: 0, maxScore: 0, count: 0 },
            quizzes: { totalScore: 0, maxScore: 0, count: 0 },
            exam: { totalScore: 0, maxScore: 0, count: 0 },
          },
          totalScore: 0,
          totalMax: 0,
          weightedScore: 0,
          grade: 'N/A',
          teacherRemarks: [],
        });
      }

      const entry = subjectMap.get(subjectId)!;
      const strandName = h.strand?.strand_name || '';
      const category = mapStrandToCategory(strandName);

      entry.assessments.push({
        score_id: ps.score_id,
        header_id: ps.header_id,
        strand_name: strandName,
        sub_strand_name: h.sub_strand?.sub_strand_name || '',
        indicator_text: h.indicator?.indicator_text || '',
        score: ps.score,
        max_score: h.max_score || 100,
        remarks: ps.remarks,
        assessment_date: h.assessment_date?.toISOString() || null,
        category,
        term: h.term,
        year: h.year,
      });

      entry.sbaComponents[category].totalScore += ps.score;
      entry.sbaComponents[category].maxScore += (h.max_score || 100);
      entry.sbaComponents[category].count++;

      if (ps.remarks && ps.remarks.trim()) {
        entry.teacherRemarks.push(ps.remarks);
      }
    }

    // Add exam marks to subjects
    for (const em of examMarks) {
      const subjectId = em.subject_id || 0;
      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          subject_id: subjectId,
          subject_name: em.subject?.name || `Subject ${subjectId}`,
          assessments: [],
          sbaComponents: {
            classwork: { totalScore: 0, maxScore: 0, count: 0 },
            homework: { totalScore: 0, maxScore: 0, count: 0 },
            tests: { totalScore: 0, maxScore: 0, count: 0 },
            projects: { totalScore: 0, maxScore: 0, count: 0 },
            quizzes: { totalScore: 0, maxScore: 0, count: 0 },
            exam: { totalScore: 0, maxScore: 0, count: 0 },
          },
          totalScore: 0,
          totalMax: 0,
          weightedScore: 0,
          grade: 'N/A',
          teacherRemarks: [],
        });
      }

      const entry = subjectMap.get(subjectId)!;
      entry.sbaComponents.exam.totalScore += em.mark_obtained;
      entry.sbaComponents.exam.maxScore += 100;
      entry.sbaComponents.exam.count++;
    }

    // Calculate weighted scores and grades per subject
    const subjects = Array.from(subjectMap.values()).map(entry => {
      let weightedTotal = 0;
      let totalWeighted = 0;

      for (const [cat, info] of Object.entries(entry.sbaComponents)) {
        const weight = SBA_WEIGHTS[cat as SBACategory].weight;
        const avgScore = info.maxScore > 0 ? (info.totalScore / info.maxScore) * 100 : 0;
        weightedTotal += avgScore * weight;
        totalWeighted += weight;
      }

      const overallPercent = totalWeighted > 0 ? weightedTotal / totalWeighted : 0;
      const grade = getGradeForScore(overallPercent, grades);

      // Calculate total from assessments only
      const assessTotalScore = entry.assessments.reduce((a, b) => a + b.score, 0);
      const assessTotalMax = entry.assessments.reduce((a, b) => a + b.max_score, 0);

      return {
        ...entry,
        weightedScore: parseFloat(overallPercent.toFixed(1)),
        grade,
        totalScore: assessTotalScore,
        totalMax: assessTotalMax,
        sbaBreakdown: Object.entries(entry.sbaComponents).map(([cat, info]) => {
          const weight = SBA_WEIGHTS[cat as SBACategory].weight;
          const avgScore = info.maxScore > 0 ? parseFloat(((info.totalScore / info.maxScore) * 100).toFixed(1)) : 0;
          return {
            category: cat as SBACategory,
            label: SBA_WEIGHTS[cat as SBACategory].label,
            weight,
            rawScore: info.totalScore,
            maxScore: info.maxScore,
            avgScore,
            weightedScore: parseFloat((avgScore * weight / 100).toFixed(1)),
            count: info.count,
            color: SBA_WEIGHTS[cat as SBACategory].color,
          };
        }),
      };
    });

    // Cumulative SBA score
    const cumWeightedTotal = subjects.reduce((a, b) => a + b.weightedScore * 1, 0);
    const cumScore = subjects.length > 0 ? cumWeightedTotal / subjects.length : 0;
    const cumGrade = getGradeForScore(cumScore, grades);

    // Determine overall status
    const totalAssessments = portfolioScores.length + examMarks.length;
    const reviewedAssessments = portfolioScores.filter(ps => ps.remarks && ps.remarks.trim()).length;
    let status = 'draft';
    if (totalAssessments > 0 && reviewedAssessments === 0) status = 'submitted';
    if (reviewedAssessments > 0 && reviewedAssessments >= Math.floor(totalAssessments * 0.5)) status = 'reviewed';

    // Build score distribution for chart
    const allScores = subjects.flatMap(s => s.assessments.map(a => a.max_score > 0 ? (a.score / a.max_score) * 100 : 0));
    const scoreDistribution = [
      { range: '0-20', count: allScores.filter(s => s >= 0 && s <= 20).length },
      { range: '21-40', count: allScores.filter(s => s > 20 && s <= 40).length },
      { range: '41-60', count: allScores.filter(s => s > 40 && s <= 60).length },
      { range: '61-80', count: allScores.filter(s => s > 60 && s <= 80).length },
      { range: '81-100', count: allScores.filter(s => s > 80 && s <= 100).length },
    ].map(d => ({
      ...d,
      percentage: allScores.length > 0 ? parseFloat(((d.count / allScores.length) * 100).toFixed(1)) : 0,
    }));

    // Get unique terms from portfolio data
    const uniqueTerms = [...new Set(portfolioScores.map(ps => ps.header?.term).filter(Boolean))];
    const uniqueYears = [...new Set(portfolioScores.map(ps => ps.header?.year).filter(Boolean))];

    return NextResponse.json({
      student,
      enrollment: enrollment ? {
        class: enrollment.class,
        section: enrollment.section,
        year: enrollment.year,
        term: enrollment.term,
      } : null,
      subjects,
      cumulative: {
        overallScore: parseFloat(cumScore.toFixed(1)),
        grade: cumGrade,
        totalSubjects: subjects.length,
        totalAssessments,
        reviewedAssessments,
        status,
      },
      scoreDistribution,
      availableTerms: uniqueTerms,
      availableYears: uniqueYears,
      allTerms,
      sbaWeights: SBA_WEIGHTS,
    });
  } catch (error) {
    console.error('Error fetching portfolio detail:', error);
    return NextResponse.json({ error: 'Failed to fetch portfolio detail' }, { status: 500 });
  }
}

// ─── PUT: Update portfolio review ───────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const studentId = parseInt(id);

    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
    }

    const body = await request.json();
    const { action, headerId, remarks, scoreId } = body;

    if (action === 'add_remarks') {
      if (!headerId && !scoreId) {
        return NextResponse.json({ error: 'headerId or scoreId is required' }, { status: 400 });
      }

      let whereClause: Record<string, unknown> = { student_id: studentId };
      if (headerId) whereClause.header_id = parseInt(headerId);
      if (scoreId) whereClause.score_id = parseInt(scoreId);

      const updated = await db.portfolioScores.updateMany({
        where: whereClause,
        data: { remarks: remarks || '' },
      });

      return NextResponse.json({
        success: true,
        message: `Remarks updated for ${updated.count} record(s)`,
        count: updated.count,
      });
    }

    if (action === 'bulk_review') {
      const { remarkText } = body;
      const allScores = await db.portfolioScores.findMany({
        where: { student_id: studentId },
        select: { score_id: true },
      });

      if (allScores.length === 0) {
        return NextResponse.json({ error: 'No portfolio scores found for this student' }, { status: 404 });
      }

      const updated = await db.portfolioScores.updateMany({
        where: {
          student_id: studentId,
          OR: [
            { remarks: '' },
            { remarks: { equals: '' } },
          ],
        },
        data: { remarks: remarkText || 'Reviewed by admin' },
      });

      return NextResponse.json({
        success: true,
        message: `${updated.count} score(s) reviewed for student`,
        count: updated.count,
      });
    }

    if (action === 'clear_remarks') {
      let whereClause: Record<string, unknown> = { student_id: studentId };
      if (headerId) whereClause.header_id = parseInt(headerId);

      const updated = await db.portfolioScores.updateMany({
        where: whereClause,
        data: { remarks: '' },
      });

      return NextResponse.json({
        success: true,
        message: `${updated.count} remark(s) cleared`,
        count: updated.count,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating portfolio:', error);
    return NextResponse.json({ error: 'Failed to update portfolio' }, { status: 500 });
  }
}
