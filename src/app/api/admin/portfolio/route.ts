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

// ─── Helper: derive portfolio status ─────────────────────────────
function deriveStatus(totalScores: number, reviewedCount: number, totalAssessments: number): string {
  if (totalScores === 0) return 'draft';
  if (reviewedCount >= totalAssessments && totalAssessments > 0) return 'reviewed';
  return 'submitted';
}

// ─── GET: List all student portfolios ───────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const sectionId = searchParams.get('sectionId');
    const term = searchParams.get('term');
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const tab = searchParams.get('tab') || 'all'; // all, pending, reviewed, statistics

    // Fetch all portfolio scores with related data
    const portfolioScores = await db.portfolioScores.findMany({
      include: {
        header: {
          include: {
            class: { select: { class_id: true, name: true, name_numeric: true } },
            subject: { select: { subject_id: true, name: true } },
            strand: { select: { strand_id: true, strand_name: true } },
            sub_strand: { select: { sub_strand_id: true, sub_strand_name: true } },
            indicator: { select: { indicator_id: true, indicator_text: true } },
          },
        },
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
      },
    });

    // Group by student + class + term + year
    const portfolioMap = new Map<string, {
      student_id: number;
      student_code: string;
      student_name: string;
      sex: string;
      class_id: number | null;
      class_name: string;
      term: string;
      year: string;
      section_id: number | null;
      subjects: Record<number, {
        subject_id: number;
        subject_name: string;
        scores: number[];
        maxScores: number[];
        remarks: string[];
        hasRemarks: boolean;
      }>;
      totalScore: number;
      totalMax: number;
      reviewedCount: number;
      totalAssessments: number;
    }>();

    for (const ps of portfolioScores) {
      const h = ps.header;
      if (!h) continue;

      const key = `${ps.student_id}-${h.class_id || '0'}-${h.term}-${h.year}`;
      if (!portfolioMap.has(key)) {
        portfolioMap.set(key, {
          student_id: ps.student_id,
          student_code: ps.student?.student_code || '',
          student_name: ps.student?.name || 'Unknown',
          sex: ps.student?.sex || '',
          class_id: h.class_id,
          class_name: h.class?.name || 'Unknown',
          term: h.term,
          year: h.year,
          section_id: null,
          subjects: {},
          totalScore: 0,
          totalMax: 0,
          reviewedCount: 0,
          totalAssessments: 0,
        });
      }

      const entry = portfolioMap.get(key)!;
      const subjectId = h.subject_id || 0;

      if (!entry.subjects[subjectId]) {
        entry.subjects[subjectId] = {
          subject_id: subjectId,
          subject_name: h.subject?.name || `Subject ${subjectId}`,
          scores: [],
          maxScores: [],
          remarks: [],
          hasRemarks: false,
        };
      }

      entry.subjects[subjectId].scores.push(ps.score);
      entry.subjects[subjectId].maxScores.push(h.max_score || 100);
      if (ps.remarks && ps.remarks.trim()) {
        entry.subjects[subjectId].remarks.push(ps.remarks);
        entry.subjects[subjectId].hasRemarks = true;
        entry.reviewedCount++;
      }
      entry.totalAssessments++;
      entry.totalScore += Math.min(ps.score, h.max_score || 100);
      entry.totalMax += (h.max_score || 100);
    }

    let portfolios = Array.from(portfolioMap.values());

    // Apply section filter from enroll table
    if (sectionId && sectionId !== '__all__') {
      const enrollments = await db.enroll.findMany({
        where: { section_id: parseInt(sectionId) },
        select: { student_id: true },
      });
      const enrolledStudentIds = new Set(enrollments.map(e => e.student_id));
      portfolios = portfolios.filter(p => enrolledStudentIds.has(p.student_id));
    }

    // Apply class filter
    if (classId && classId !== '__all__') {
      portfolios = portfolios.filter(p => p.class_id === parseInt(classId));
    }

    // Apply term filter
    if (term && term !== '__all__') {
      portfolios = portfolios.filter(p => p.term === term);
    }

    // Apply search
    if (search) {
      const q = search.toLowerCase();
      portfolios = portfolios.filter(p =>
        p.student_name.toLowerCase().includes(q) ||
        p.student_code.toLowerCase().includes(q) ||
        p.first_name?.toLowerCase().includes(q) ||
        (p as Record<string, unknown>).last_name && String((p as Record<string, unknown>).last_name).toLowerCase().includes(q)
      );
    }

    // Calculate overall scores and grades
    const grades = await getGrades();
    portfolios = portfolios.map(p => {
      const overallPercent = p.totalMax > 0 ? (p.totalScore / p.totalMax) * 100 : 0;
      const statusVal = deriveStatus(p.totalAssessments, p.reviewedCount, p.totalAssessments);
      const grade = getGradeForScore(overallPercent, grades);
      const subjectCount = Object.keys(p.subjects).length;
      const subjectAverages = Object.values(p.subjects).map(s => {
        const total = s.scores.reduce((a, b) => a + b, 0);
        const maxTotal = s.maxScores.reduce((a, b) => a + b, 0);
        return maxTotal > 0 ? (total / maxTotal) * 100 : 0;
      });
      const avgSubjectScore = subjectAverages.length > 0
        ? subjectAverages.reduce((a, b) => a + b, 0) / subjectAverages.length
        : 0;

      return {
        ...p,
        overallScore: parseFloat(overallPercent.toFixed(1)),
        grade,
        status: statusVal,
        subjectCount,
        avgSubjectScore: parseFloat(avgSubjectScore.toFixed(1)),
      };
    });

    // Apply status filter
    if (status && status !== '__all__') {
      portfolios = portfolios.filter(p => p.status === status);
    }

    // Tab filters
    if (tab === 'pending') {
      portfolios = portfolios.filter(p => p.status === 'submitted');
    } else if (tab === 'reviewed') {
      portfolios = portfolios.filter(p => p.status === 'reviewed');
    }

    // Statistics tab
    if (tab === 'statistics') {
      const total = portfolios.length;
      const draftCount = portfolios.filter(p => p.status === 'draft').length;
      const submittedCount = portfolios.filter(p => p.status === 'submitted').length;
      const reviewedCount = portfolios.filter(p => p.status === 'reviewed').length;
      const avgScore = total > 0
        ? portfolios.reduce((a, b) => a + b.overallScore, 0) / total
        : 0;
      const passCount = portfolios.filter(p => p.overallScore >= 50).length;
      const distinctionCount = portfolios.filter(p => p.overallScore >= 80).length;
      const gradeDist: Record<string, number> = {};
      for (const p of portfolios) {
        gradeDist[p.grade] = (gradeDist[p.grade] || 0) + 1;
      }
      const topPerformers = [...portfolios]
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, 10)
        .map(p => ({ student_id: p.student_id, student_name: p.student_name, student_code: p.student_code, overallScore: p.overallScore, grade: p.grade }));

      return NextResponse.json({
        statistics: {
          total,
          draft: draftCount,
          submitted: submittedCount,
          reviewed: reviewedCount,
          avgScore: parseFloat(avgScore.toFixed(1)),
          passRate: total > 0 ? parseFloat(((passCount / total) * 100).toFixed(1)) : 0,
          distinctionRate: total > 0 ? parseFloat(((distinctionCount / total) * 100).toFixed(1)) : 0,
          gradeDistribution: Object.entries(gradeDist).map(([grade, count]) => ({
            grade,
            count,
            percentage: total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0,
          })),
          topPerformers,
        },
      });
    }

    // Sort by overall score descending
    portfolios.sort((a, b) => b.overallScore - a.overallScore);

    // Pagination
    const total = portfolios.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const paginatedPortfolios = portfolios.slice(skip, skip + limit);

    // Get available terms and classes for filters
    const allTerms = await db.terms.findMany({ select: { term_id: true, name: true } });
    const allClasses = await db.school_class.findMany({
      select: { class_id: true, name: true },
      orderBy: { name_numeric: 'asc' },
    });

    return NextResponse.json({
      portfolios: paginatedPortfolios,
      filters: {
        terms: allTerms,
        classes: allClasses,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    return NextResponse.json({ error: 'Failed to fetch portfolios' }, { status: 500 });
  }
}

// ─── POST: Bulk review actions ──────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, portfolioIds, remarks } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    if (action === 'bulk_review') {
      if (!portfolioIds || !Array.isArray(portfolioIds) || portfolioIds.length === 0) {
        return NextResponse.json({ error: 'portfolioIds array is required' }, { status: 400 });
      }

      // Add review remarks to all portfolio scores for the given student portfolios
      const studentIds = portfolioIds.map((id: number) => id);
      const updated = await db.portfolioScores.updateMany({
        where: {
          student_id: { in: studentIds },
          remarks: { in: ['', ''] as unknown as string[] }, // Only update those without remarks
        },
        data: {
          remarks: remarks || 'Reviewed by admin',
        },
      });

      return NextResponse.json({
        success: true,
        message: `${updated.count} portfolio score(s) reviewed`,
        count: updated.count,
      });
    }

    if (action === 'add_remarks') {
      const { studentId, headerId, remarkText } = body;
      if (!studentId || !headerId) {
        return NextResponse.json({ error: 'studentId and headerId are required' }, { status: 400 });
      }

      const updated = await db.portfolioScores.updateMany({
        where: {
          student_id: parseInt(studentId),
          header_id: parseInt(headerId),
        },
        data: {
          remarks: remarkText || '',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Remarks added successfully',
        count: updated.count,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Error in portfolio POST:', error);
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
}
