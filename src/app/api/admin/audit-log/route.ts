import { NextRequest, NextResponse } from 'next/server';

// --- Sample data generator ---

const USERS = [
  { name: 'Admin User', role: 'admin' },
  { name: 'Sarah Johnson', role: 'teacher' },
  { name: 'Michael Chen', role: 'admin' },
  { name: 'Emily Davis', role: 'teacher' },
  { name: 'David Okafor', role: 'admin' },
  { name: 'Grace Muthoni', role: 'teacher' },
  { name: 'James Wilson', role: 'accountant' },
  { name: 'Amira Hassan', role: 'librarian' },
  { name: 'System', role: 'system' },
];

const ACTIONS: Array<{
  type: 'create' | 'update' | 'delete' | 'login' | 'export' | 'error';
  descriptions: string[];
}> = [
  {
    type: 'create',
    descriptions: [
      'Created new student record for John Smith (Grade 10A)',
      'Created new notice: "Mid-Term Exam Schedule Released"',
      'Created new teacher account for Mrs. Rosemary Peters',
      'Created invoice INV-2025-00142 for parent payment',
      'Created new class section: Grade 7 - Section C',
      'Created new subject: Computer Science (Grade 11)',
      'Created fee structure for Term 2, 2025',
      'Created new parent account linked to student #1024',
      'Created backup job scheduled for daily at 02:00 AM',
      'Created exam schedule for Mid-Term examinations',
    ],
  },
  {
    type: 'update',
    descriptions: [
      'Updated student profile: Emily Brown — changed class from 9B to 10A',
      'Updated fee payment status: Invoice INV-2025-00098 marked as paid',
      'Updated attendance records for Grade 8A — 14 May 2025',
      'Updated teacher salary details for Mr. David Okafor',
      'Updated school calendar: added public holiday on 1st June',
      'Updated exam marks for Mathematics — Grade 10B',
      'Updated library book status: "Advanced Physics" returned',
      'Updated transport route #3 — added new stop at Oak Street',
      'Updated system settings: changed session timeout to 30 minutes',
      'Updated notice #47: extended end date to 15 July',
    ],
  },
  {
    type: 'delete',
    descriptions: [
      'Deleted expired notice: "Holiday Celebration 2024"',
      'Removed teacher account: Mr. Alan Torres (resigned)',
      'Deleted old backup file: backup_2024_12_01.sql.gz',
      'Removed inactive student record #856 (transferred out)',
      'Deleted draft invoice INV-2025-DRAFT-003 (never sent)',
      'Removed obsolete fee structure for Academic Year 2023',
      'Deleted cancelled exam: Supplementary Science Paper',
    ],
  },
  {
    type: 'login',
    descriptions: [
      'Successful login from Chrome/Windows',
      'Successful login from Safari/macOS',
      'Successful login from Firefox/Linux',
      'Successful login from Chrome/Android',
      'Successful login via mobile app (iOS)',
      'Failed login attempt — invalid credentials (3rd attempt)',
    ],
  },
  {
    type: 'export',
    descriptions: [
      'Exported student list (Grade 10A) to CSV',
      'Exported fee collection report for Term 1, 2025',
      'Exported attendance summary for May 2025',
      'Exported exam results for Grade 12 — Final Term',
      'Exported financial report: Q1 2025 revenue summary',
      'Exported teacher payroll report for April 2025',
    ],
  },
  {
    type: 'error',
    descriptions: [
      'Database connection timeout during bulk attendance save',
      'File upload failed: exceeds 4MB limit (document.pdf)',
      'SMS delivery failed to 5 parent contacts — service timeout',
      'Payment gateway returned error: Invalid merchant credentials',
      'Email sending failed: SMTP connection refused for 12 recipients',
      'Backup job failed: insufficient disk space on server',
    ],
  },
];

const IP_ADDRESSES = [
  '192.168.1.45', '192.168.1.102', '192.168.1.15', '10.0.0.88',
  '192.168.1.200', '10.0.0.12', '172.16.0.34', '192.168.1.77',
  '10.0.0.55', '192.168.1.160', '127.0.0.1', '192.168.1.33',
];

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function generateAuditLogs(count: number, seed: number = 42) {
  const logs = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const s = seed + i;
    const r = seededRandom(s);
    const user = USERS[Math.floor(seededRandom(s * 2) * USERS.length)];
    const actionGroup = ACTIONS[Math.floor(seededRandom(s * 3) * ACTIONS.length)];
    const descIdx = Math.floor(seededRandom(s * 4) * actionGroup.descriptions.length);
    const daysAgo = Math.floor(seededRandom(s * 5) * 30);
    const hoursAgo = Math.floor(seededRandom(s * 6) * 24);
    const minutesAgo = Math.floor(seededRandom(s * 7) * 60);
    const timestamp = new Date(now.getTime() - (daysAgo * 86400000 + hoursAgo * 3600000 + minutesAgo * 60000));
    const ip = IP_ADDRESSES[Math.floor(seededRandom(s * 8) * IP_ADDRESSES.length)];

    const detailFields: Record<string, string> = {};
    if (actionGroup.type === 'update') {
      detailFields['changes'] = JSON.stringify({
        before: { status: 'pending' },
        after: { status: 'completed' },
      });
    }
    if (actionGroup.type === 'error') {
      detailFields['stack_trace'] = 'Error: Connection timeout\n  at Database.connect (db.js:142)\n  at async processRequest (server.js:89)';
      detailFields['severity'] = r > 0.5 ? 'high' : 'medium';
    }

    logs.push({
      id: 1000 + count - i,
      timestamp: timestamp.toISOString(),
      user: user.name,
      role: user.role,
      action: actionGroup.type,
      description: actionGroup.descriptions[descIdx],
      ip_address: ip,
      details: Object.keys(detailFields).length > 0 ? detailFields : null,
    });
  }
  return logs;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const search = searchParams.get('search') || '';
  const actionType = searchParams.get('actionType') || '';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '15', 10);

  // Generate a large set of sample data
  const allLogs = generateAuditLogs(150);

  // Apply filters
  let filtered = [...allLogs];

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (log) =>
        log.user.toLowerCase().includes(q) ||
        log.description.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q)
    );
  }

  if (actionType) {
    filtered = filtered.filter((log) => log.action === actionType);
  }

  if (dateFrom) {
    const from = new Date(dateFrom);
    filtered = filtered.filter((log) => new Date(log.timestamp) >= from);
  }

  if (dateTo) {
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    filtered = filtered.filter((log) => new Date(log.timestamp) <= to);
  }

  // Sort by timestamp descending
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Pagination
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  // Stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayLogs = allLogs.filter((l) => new Date(l.timestamp) >= today);
  const errorLogs = allLogs.filter((l) => l.action === 'error');

  // Most active user
  const userCounts: Record<string, number> = {};
  allLogs.forEach((l) => {
    if (l.role !== 'system') {
      userCounts[l.user] = (userCounts[l.user] || 0) + 1;
    }
  });
  const mostActiveUser = Object.entries(userCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  return NextResponse.json({
    logs: paginated,
    stats: {
      total: allLogs.length,
      todayActivity: todayLogs.length,
      mostActiveUser,
      errorCount: errorLogs.length,
    },
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
}
