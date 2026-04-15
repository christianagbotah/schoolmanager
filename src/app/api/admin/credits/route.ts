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

// ── Mock credit-note & overpayment data ─────────────────────────────
function mockCredits(): CreditEntry[] {
  const names = [
    { name: 'Ama Mensah', code: 'STU001', class: 'JHS 1A' },
    { name: 'Kwame Asante', code: 'STU002', class: 'JHS 2B' },
    { name: 'Abena Osei', code: 'STU003', class: 'JHS 3A' },
    { name: 'Kofi Boateng', code: 'STU004', class: 'Primary 5B' },
    { name: 'Akua Sarpong', code: 'STU005', class: 'Primary 6A' },
    { name: 'Yaw Adjei', code: 'STU006', class: 'JHS 1B' },
    { name: 'Efua Darko', code: 'STU007', class: 'JHS 2A' },
    { name: 'Nana Akufo', code: 'STU008', class: 'Primary 4A' },
    { name: 'Adwoa Poku', code: 'STU009', class: 'JHS 3B' },
    { name: 'Kojo Annan', code: 'STU010', class: 'Primary 3B' },
    { name: 'Ama Frimpong', code: 'STU011', class: 'JHS 1A' },
    { name: 'Emmanuel Tetteh', code: 'STU012', class: 'Primary 5A' },
  ];

  const creditNotes: CreditEntry[] = names.map((s, i) => ({
    id: 1000 + i,
    student_id: 1000 + i,
    student_name: s.name,
    student_code: s.code,
    type: 'credit_note' as const,
    category: 'general',
    amount: Math.round((Math.random() * 200 + 20) * 100) / 100,
    balance: Math.round((Math.random() * 150 + 10) * 100) / 100,
    status: (['active', 'used', 'pending'] as const)[i % 3],
    reason: [
      'Fee adjustment for term discount',
      'Scholarship credit awarded',
      'Correction for billing error',
      'Financial aid allocation',
      'Sibling discount applied',
      'Early payment reward',
      'Boarding subsidy',
      'PTA contribution credit',
      'Sports fee waiver',
      'Library membership credit',
      'Transport subsidy',
      'Exam fee adjustment',
    ][i],
    date: new Date(2025, 0, Math.min(28, 5 + i * 2)).toISOString().split('T')[0],
    class_name: s.class,
  }));

  const overpayments: CreditEntry[] = names.slice(0, 7).map((s, i) => ({
    id: 2000 + i,
    student_id: 1000 + i,
    student_name: s.name,
    student_code: s.code,
    type: 'overpayment' as const,
    category: 'general',
    amount: Math.round((Math.random() * 300 + 50) * 100) / 100,
    balance: Math.round((Math.random() * 250 + 20) * 100) / 100,
    status: (['active', 'pending'] as const)[i % 2],
    reason: [
      'Overpayment on term fees – Jan 2025',
      'Excess payment on boarding fees',
      'Double payment correction',
      'Overpayment carried from last term',
      'Extra amount paid via mobile money',
      'Surplus from combined invoice payment',
      'Refund pending from excursion fees',
    ][i],
    date: new Date(2025, 0, Math.min(28, 3 + i * 3)).toISOString().split('T')[0],
    class_name: s.class,
  }));

  return [...creditNotes, ...overpayments];
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
    let credits: CreditEntry[] = [...mockCredits(), ...walletCredits];

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
