import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// ── Types ────────────────────────────────────────────────────────────
interface CreditEntry {
  id: number;
  student_id: number;
  student_name: string;
  student_code: string;
  type: 'credit_note' | 'overpayment' | 'wallet_topup';
  category: string;           // feeding | breakfast | classes | water | transport | general
  amount: number;
  balance: number;
  status: 'active' | 'used' | 'expired' | 'pending';
  reason: string;
  date: string;
  class_name: string;
}

// ── GET ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const type = sp.get('type') || '';          // credit_note | overpayment | wallet_topup
    const search = (sp.get('search') || '').toLowerCase();
    const classFilter = sp.get('class') || '';
    const dateFrom = sp.get('dateFrom') || '';
    const dateTo = sp.get('dateTo') || '';

    // ── Collect real credit notes from DB ────────────────────────────
    const creditNoteRows = await db.credit_notes.findMany({
      orderBy: { created_at: 'desc' },
    });

    // Gather unique student IDs from credit notes
    const cnStudentIds = [...new Set(creditNoteRows.map(r => r.student_id).filter((id): id is number => id != null))];

    // Fetch student info + enrollment for those IDs
    const cnStudents = cnStudentIds.length > 0
      ? await db.student.findMany({
          where: { student_id: { in: cnStudentIds } },
          select: { student_id: true, name: true, student_code: true },
        })
      : [];
    const cnStudentMap = new Map(cnStudents.map(s => [s.student_id, s]));

    const cnEnrollments = cnStudentIds.length > 0
      ? await db.enroll.findMany({
          where: { student_id: { in: cnStudentIds } },
          include: { class: { select: { name: true } } },
          distinct: ['student_id'],
        })
      : [];
    const cnEnrollMap = new Map(cnEnrollments.map(e => [e.student_id, e.class?.name || '']));

    const dbCreditNotes: CreditEntry[] = creditNoteRows.map(cn => {
      const stu = cnStudentMap.get(cn.student_id ?? 0);
      return {
        id: cn.credit_note_id,
        student_id: cn.student_id ?? 0,
        student_name: stu?.name || 'Unknown',
        student_code: stu?.student_code || '',
        type: 'credit_note' as const,
        category: 'general',
        amount: cn.amount,
        balance: cn.status === 'active' ? cn.amount : 0,
        status: (cn.status || 'active') as CreditEntry['status'],
        reason: cn.reason || cn.credit_number || '',
        date: cn.created_at ? new Date(cn.created_at).toISOString().split('T')[0] : '',
        class_name: cnEnrollMap.get(cn.student_id ?? 0) || '',
      };
    });

    // ── Collect wallet top-up rows from real transactions ────────────
    const walletTxs = await db.daily_fee_transactions.findMany({
      where: {
        total_amount: { gt: 0 },
        payment_type: { not: 'charge' },
        student_id: { not: 0 },
      },
      include: {
        student: { select: { name: true, student_code: true } },
      },
      orderBy: { payment_date: 'desc' },
      take: 200,
    });

    // Try to get class info from enrollment
    const studentIds = walletTxs.map(t => t.student_id);
    const enrollments = studentIds.length > 0
      ? await db.enroll.findMany({
          where: { student_id: { in: studentIds } },
          include: { class: { select: { name: true } } },
          distinct: ['student_id'],
        })
      : [];
    const enrollMap = new Map(enrollments.map(e => [e.student_id, e.class?.name || '']));

    const walletCredits: CreditEntry[] = walletTxs.map(t => {
      const cats = [
        { cat: 'feeding', amt: t.feeding_amount },
        { cat: 'breakfast', amt: t.breakfast_amount },
        { cat: 'classes', amt: t.classes_amount },
        { cat: 'water', amt: t.water_amount },
        { cat: 'transport', amt: t.transport_amount },
      ];
      const main = cats.reduce((a, b) => b.amt >= a.amt ? b : a);
      return {
        id: t.id + 5000,
        student_id: t.student_id,
        student_name: t.student?.name || 'Unknown',
        student_code: t.student?.student_code || '',
        type: 'wallet_topup' as const,
        category: main.cat,
        amount: t.total_amount,
        balance: t.total_amount,
        status: 'active' as const,
        reason: `${t.payment_method} – ${main.cat} wallet top-up`,
        date: t.payment_date ? new Date(t.payment_date).toISOString().split('T')[0] : '',
        class_name: enrollMap.get(t.student_id) || '',
      };
    });

    // ── Merge all ────────────────────────────────────────────────────
    let credits: CreditEntry[] = [...dbCreditNotes, ...walletCredits];

    // ── Filter by type ───────────────────────────────────────────────
    if (type) credits = credits.filter(c => c.type === type);

    // ── Search ───────────────────────────────────────────────────────
    if (search) {
      credits = credits.filter(
        c =>
          c.student_name.toLowerCase().includes(search) ||
          c.student_code.toLowerCase().includes(search) ||
          c.reason.toLowerCase().includes(search),
      );
    }

    // ── Class filter ─────────────────────────────────────────────────
    if (classFilter) {
      credits = credits.filter(c => c.class_name === classFilter);
    }

    // ── Date range ───────────────────────────────────────────────────
    if (dateFrom) credits = credits.filter(c => c.date >= dateFrom);
    if (dateTo) credits = credits.filter(c => c.date <= dateTo);

    // ── Sort by date desc ────────────────────────────────────────────
    credits.sort((a, b) => b.date.localeCompare(a.date));

    // ── Summary stats ────────────────────────────────────────────────
    const totalIssued = credits.reduce((s, c) => s + c.amount, 0);
    const activeStudents = new Set(credits.filter(c => c.status === 'active').map(c => c.student_id)).size;
    const activeCredits = credits.filter(c => c.status === 'active');
    const avgBalance = activeCredits.length > 0
      ? activeCredits.reduce((s, c) => s + c.balance, 0) / activeCredits.length
      : 0;
    const pendingRefunds = credits
      .filter(c => c.status === 'pending')
      .reduce((s, c) => s + c.balance, 0);

    // ── Unique class names for filter ────────────────────────────────
    const classes = [...new Set(credits.map(c => c.class_name).filter(Boolean))].sort();

    return NextResponse.json({
      credits,
      summary: {
        totalIssued: Math.round(totalIssued * 100) / 100,
        activeStudents,
        avgBalance: Math.round(avgBalance * 100) / 100,
        pendingRefunds: Math.round(pendingRefunds * 100) / 100,
      },
      classes,
    });
  } catch (error) {
    console.error('Error fetching credits:', error);
    return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 });
  }
}

// ── POST – Create a new credit ───────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { student_id, type, category, amount, reason } = body;

    if (!student_id || !type || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'student_id, type, and a positive amount are required' },
        { status: 400 },
      );
    }

    // For wallet top-ups, update the daily_fee_wallet
    if (type === 'wallet_topup' && category) {
      const fieldMap: Record<string, string> = {
        feeding: 'feeding_balance',
        breakfast: 'breakfast_balance',
        classes: 'classes_balance',
        water: 'water_balance',
        transport: 'transport_balance',
      };
      const field = fieldMap[category];
      if (!field) {
        return NextResponse.json({ error: 'Invalid wallet category' }, { status: 400 });
      }

      // Upsert wallet
      const existing = await db.daily_fee_wallet.findUnique({
        where: { student_id },
      });

      if (existing) {
        await db.daily_fee_wallet.update({
          where: { student_id },
          data: { [field]: { increment: amount } },
        });
      } else {
        await db.daily_fee_wallet.create({
          data: { student_id, [field]: amount },
        });
      }

      // Record transaction
      await db.daily_fee_transactions.create({
        data: {
          student_id,
          payment_date: new Date(),
          [`${category}_amount`]: amount,
          total_amount: amount,
          payment_type: 'topup',
          payment_method: 'credit',
          collected_by: 'admin',
          year: new Date().getFullYear().toString(),
          term: '1',
        },
      });
    }

    // Get student info for response
    const student = await db.student.findUnique({
      where: { student_id },
      select: { name: true, student_code: true },
    });

    const newCredit: CreditEntry = {
      id: Date.now(),
      student_id,
      student_name: student?.name || 'Unknown',
      student_code: student?.student_code || '',
      type,
      category: category || 'general',
      amount,
      balance: amount,
      status: 'active',
      reason: reason || '',
      date: new Date().toISOString().split('T')[0],
      class_name: '',
    };

    return NextResponse.json({ credit: newCredit, success: true });
  } catch (error) {
    console.error('Error creating credit:', error);
    return NextResponse.json({ error: 'Failed to create credit' }, { status: 500 });
  }
}
