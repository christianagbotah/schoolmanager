import { NextRequest, NextResponse } from 'next/server';
import { copyFile, readdir, stat, unlink, mkdir } from 'fs/promises';
import { existsSync, createReadStream } from 'fs';
import path from 'path';
import { db } from '@/lib/db';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db');

// ---------------------------------------------------------------------------
// Types (kept identical to what the frontend expects)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Extract ISO timestamp from filename like `backup_2026-04-16T10-30-00.db` */
function getTimestampFromFilename(filename: string): string {
  const match = filename.match(/backup_(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})\.db$/);
  if (!match) return '';
  // Rebuild ISO string: 2026-04-16T10:30:00
  return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}`;
}

/** Generate a timestamped backup filename */
function generateBackupFilename(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = now.getFullYear();
  const mo = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  const h = pad(now.getHours());
  const mi = pad(now.getMinutes());
  const s = pad(now.getSeconds());
  return `backup_${y}-${mo}-${d}T${h}-${mi}-${s}.db`;
}

async function ensureBackupDir(): Promise<void> {
  if (!existsSync(BACKUP_DIR)) {
    await mkdir(BACKUP_DIR, { recursive: true });
  }
}

/** Query the live SQLite database for table count and total records */
async function getDatabaseInfo(): Promise<{ tables: number; totalRecords: number }> {
  try {
    const rows = await db.$queryRawUnsafe<{ name: string }[]>(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
    );

    let totalRecords = 0;
    for (const row of rows) {
      try {
        const result = await db.$queryRawUnsafe<{ cnt: number }[]>(
          `SELECT COUNT(*) as cnt FROM "${row.name}"`
        );
        totalRecords += result[0]?.cnt ?? 0;
      } catch {
        // Some internal / virtual tables may fail — skip them
      }
    }

    return { tables: rows.length, totalRecords };
  } catch {
    return { tables: 0, totalRecords: 0 };
  }
}

/** Get the current database file size */
async function getDbFileSize(): Promise<{ size: number; formatted: string }> {
  try {
    const s = await stat(DB_PATH);
    return { size: s.size, formatted: formatFileSize(s.size) };
  } catch {
    return { size: 0, formatted: 'Unknown' };
  }
}

/** List all `.db` backup files from disk, sorted newest-first */
async function listBackups(): Promise<BackupRecord[]> {
  await ensureBackupDir();

  let files: string[];
  try {
    const all = await readdir(BACKUP_DIR);
    files = all.filter((f) => f.startsWith('backup_') && f.endsWith('.db'));
  } catch {
    return [];
  }

  // Read current DB stats once (for tables/records on completed backups)
  const dbInfo = await getDatabaseInfo();

  const backups: BackupRecord[] = [];
  for (const file of files) {
    try {
      const filePath = path.join(BACKUP_DIR, file);
      const fileStat = await stat(filePath);
      const ts = getTimestampFromFilename(file);
      const created = ts ? new Date(ts).toISOString() : fileStat.mtime.toISOString();

      backups.push({
        id: 0, // assigned after sorting
        filename: file,
        created_at: created,
        file_size: formatFileSize(fileStat.size),
        file_size_bytes: fileStat.size,
        type: 'manual',
        status: fileStat.size > 0 ? 'completed' : 'failed',
        tables: fileStat.size > 0 ? dbInfo.tables : 0,
        records: fileStat.size > 0 ? dbInfo.totalRecords : 0,
      });
    } catch {
      // skip unreadable files
    }
  }

  // Sort newest first, then assign sequential IDs
  backups.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  backups.forEach((b, i) => {
    b.id = i + 1;
  });

  return backups;
}

// ---------------------------------------------------------------------------
// GET – list backups OR download a file (when `?download=<filename>`)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  // Download mode: serve a backup file
  const { searchParams } = new URL(request.url);
  const downloadFilename = searchParams.get('download');
  if (downloadFilename) {
    const safeName = path.basename(downloadFilename); // prevent path traversal
    const filePath = path.join(BACKUP_DIR, safeName);

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { success: false, message: 'Backup file not found' },
        { status: 404 }
      );
    }

    const fileStat = await stat(filePath);
    const readable = createReadStream(filePath);

    return new NextResponse(readable as unknown as ReadableStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-sqlite3',
        'Content-Disposition': `attachment; filename="${safeName}"`,
        'Content-Length': String(fileStat.size),
      },
    });
  }

  // Normal listing mode
  const backups = await listBackups();
  const completed = backups.filter((b) => b.status === 'completed');
  const latestBackup = completed[0] ?? null;
  const dbFileSize = await getDbFileSize();
  const dbInfo = await getDatabaseInfo();

  return NextResponse.json({
    backups,
    stats: {
      totalBackups: backups.length,
      latestBackup: latestBackup
        ? { date: latestBackup.created_at, filename: latestBackup.filename }
        : null,
      databaseSize: dbFileSize.formatted,
      autoBackupEnabled: true,
      autoBackupSchedule: 'daily',
      retentionDays: 30,
    },
    databaseInfo: {
      tables: dbInfo.tables,
      totalRecords: dbInfo.totalRecords,
      engine: 'SQLite',
      version: '3.x',
      lastOptimized: new Date().toISOString(),
    },
  });
}

// ---------------------------------------------------------------------------
// POST – create a new backup by copying the live DB file
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // Verify source DB exists
    if (!existsSync(DB_PATH)) {
      return NextResponse.json(
        { success: false, message: 'Database file not found' },
        { status: 500 }
      );
    }

    await ensureBackupDir();

    const body = await request.json();
    const filename = generateBackupFilename();
    const destPath = path.join(BACKUP_DIR, filename);

    await copyFile(DB_PATH, destPath);

    const fileStat = await stat(destPath);
    const dbInfo = await getDatabaseInfo();

    const backup: BackupRecord = {
      id: 1, // will always be 1 since it's the newest
      filename,
      created_at: new Date().toISOString(),
      file_size: formatFileSize(fileStat.size),
      file_size_bytes: fileStat.size,
      type: (body.type as 'manual' | 'auto') || 'manual',
      status: 'completed',
      tables: dbInfo.tables,
      records: dbInfo.totalRecords,
    };

    return NextResponse.json(
      {
        success: true,
        backup,
        message: 'Backup created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create backup';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE – remove a backup file from disk (identifies by sequential `id`)
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '0', 10);

    const backups = await listBackups();
    const target = backups.find((b) => b.id === id);

    if (!target) {
      return NextResponse.json(
        { success: false, message: 'Backup not found' },
        { status: 404 }
      );
    }

    const filePath = path.join(BACKUP_DIR, target.filename);
    await unlink(filePath);

    return NextResponse.json({
      success: true,
      message: `Backup "${target.filename}" deleted successfully`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete backup';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
