import { NextRequest, NextResponse } from 'next/server';

// --- Sample backup data ---

interface BackupRecord {
  id: number;
  filename: string;
  created_at: string;
  file_size: string;
  file_size_bytes: number;
  type: 'manual' | 'auto';
  status: 'completed' | 'failed' | 'in_progress';
  tables: number;
  records: number;
}

const BACKUP_DB: BackupRecord[] = [
  {
    id: 1,
    filename: 'school_db_backup_2025_06_15_020000.sql.gz',
    created_at: '2025-06-15T02:00:00Z',
    file_size: '24.3 MB',
    file_size_bytes: 25480396,
    type: 'auto',
    status: 'completed',
    tables: 47,
    records: 156780,
  },
  {
    id: 2,
    filename: 'school_db_backup_2025_06_14_140523.sql.gz',
    created_at: '2025-06-14T14:05:23Z',
    file_size: '24.1 MB',
    file_size_bytes: 25270784,
    type: 'manual',
    status: 'completed',
    tables: 47,
    records: 156412,
  },
  {
    id: 3,
    filename: 'school_db_backup_2025_06_14_020000.sql.gz',
    created_at: '2025-06-14T02:00:00Z',
    file_size: '24.0 MB',
    file_size_bytes: 25165824,
    type: 'auto',
    status: 'completed',
    tables: 47,
    records: 156100,
  },
  {
    id: 4,
    filename: 'school_db_backup_2025_06_13_020000.sql.gz',
    created_at: '2025-06-13T02:00:00Z',
    file_size: '23.8 MB',
    file_size_bytes: 24956108,
    type: 'auto',
    status: 'completed',
    tables: 47,
    records: 155890,
  },
  {
    id: 5,
    filename: 'school_db_backup_2025_06_12_020000.sql.gz',
    created_at: '2025-06-12T02:00:00Z',
    file_size: '23.6 MB',
    file_size_bytes: 24746396,
    type: 'auto',
    status: 'completed',
    tables: 47,
    records: 155200,
  },
  {
    id: 6,
    filename: 'school_db_backup_2025_06_11_190032.sql.gz',
    created_at: '2025-06-11T19:00:32Z',
    file_size: '23.5 MB',
    file_size_bytes: 24641587,
    type: 'manual',
    status: 'completed',
    tables: 47,
    records: 154980,
  },
  {
    id: 7,
    filename: 'school_db_backup_2025_06_11_020000.sql.gz',
    created_at: '2025-06-11T02:00:00Z',
    file_size: '23.4 MB',
    file_size_bytes: 24536678,
    type: 'auto',
    status: 'completed',
    tables: 47,
    records: 154500,
  },
  {
    id: 8,
    filename: 'school_db_backup_2025_06_10_020000.sql.gz',
    created_at: '2025-06-10T02:00:00Z',
    file_size: '0 KB',
    file_size_bytes: 0,
    type: 'auto',
    status: 'failed',
    tables: 0,
    records: 0,
  },
  {
    id: 9,
    filename: 'school_db_backup_2025_06_09_020000.sql.gz',
    created_at: '2025-06-09T02:00:00Z',
    file_size: '23.1 MB',
    file_size_bytes: 24222105,
    type: 'auto',
    status: 'completed',
    tables: 47,
    records: 153800,
  },
  {
    id: 10,
    filename: 'school_db_backup_2025_06_08_020000.sql.gz',
    created_at: '2025-06-08T02:00:00Z',
    file_size: '23.0 MB',
    file_size_bytes: 24117248,
    type: 'auto',
    status: 'completed',
    tables: 47,
    records: 153450,
  },
];

let nextId = 11;

export async function GET() {
  const sorted = [...BACKUP_DB].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const completed = sorted.filter((b) => b.status === 'completed');
  const latestBackup = completed[0] || null;
  const totalRecords = completed.reduce((sum, b) => sum + b.records, 0);
  const avgRecords = completed.length > 0 ? Math.round(totalRecords / completed.length) : 0;

  return NextResponse.json({
    backups: sorted,
    stats: {
      totalBackups: sorted.length,
      latestBackup: latestBackup
        ? {
            date: latestBackup.created_at,
            filename: latestBackup.filename,
          }
        : null,
      databaseSize: '24.3 MB',
      autoBackupEnabled: true,
      autoBackupSchedule: 'daily',
      retentionDays: 30,
    },
    databaseInfo: {
      tables: 47,
      totalRecords: avgRecords,
      engine: 'SQLite',
      version: '3.39.0',
      lastOptimized: '2025-06-14T03:00:00Z',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '_');
    const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '');

    // Simulate backup creation (random success/fail)
    const isSuccess = Math.random() > 0.1; // 90% success rate

    const newBackup: BackupRecord = {
      id: nextId++,
      filename: `school_db_backup_${dateStr}_${timeStr}.sql.gz`,
      created_at: now.toISOString(),
      file_size: isSuccess ? '24.4 MB' : '0 KB',
      file_size_bytes: isSuccess ? 25585254 : 0,
      type: body.type || 'manual',
      status: isSuccess ? 'completed' : 'failed',
      tables: isSuccess ? 47 : 0,
      records: isSuccess ? 157200 : 0,
    };

    BACKUP_DB.unshift(newBackup);

    return NextResponse.json(
      {
        success: true,
        backup: newBackup,
        message: isSuccess
          ? 'Backup created successfully'
          : 'Backup creation failed. Please try again.',
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Failed to create backup' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get('id') || '0', 10);

  const index = BACKUP_DB.findIndex((b) => b.id === id);
  if (index === -1) {
    return NextResponse.json(
      { success: false, message: 'Backup not found' },
      { status: 404 }
    );
  }

  const removed = BACKUP_DB.splice(index, 1)[0];
  return NextResponse.json({
    success: true,
    message: `Backup "${removed.filename}" deleted successfully`,
  });
}
