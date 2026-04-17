'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Progress,
} from '@/components/ui/progress';
import {
  Database, HardDrive, Clock, ShieldCheck, Plus, Download, Trash2,
  Eye, RefreshCw, Calendar, FileArchive, Server, CheckCircle2,
  XCircle, AlertTriangle, Settings, Info, Zap,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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

interface BackupStats {
  totalBackups: number;
  latestBackup: { date: string; filename: string } | null;
  databaseSize: string;
  autoBackupEnabled: boolean;
  autoBackupSchedule: string;
  retentionDays: number;
}

interface DatabaseInfo {
  tables: number;
  totalRecords: number;
  engine: string;
  version: string;
  lastOptimized: string;
}

export default function BackupPage() {
  const { toast } = useToast();
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [stats, setStats] = useState<BackupStats>({
    totalBackups: 0, latestBackup: null, databaseSize: '—',
    autoBackupEnabled: true, autoBackupSchedule: 'daily', retentionDays: 30,
  });
  const [dbInfo, setDbInfo] = useState<DatabaseInfo>({
    tables: 0, totalRecords: 0, engine: '', version: '', lastOptimized: '',
  });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBackup, setDeleteBackup] = useState<BackupRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Auto-backup settings (local state, not persisted)
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [backupSchedule, setBackupSchedule] = useState('daily');
  const [retentionDays, setRetentionDays] = useState('30');

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/backup');
      const data = await res.json();
      setBackups(data.backups || []);
      setStats(data.stats || stats);
      setDbInfo(data.databaseInfo || dbInfo);
      setAutoBackupEnabled(data.stats?.autoBackupEnabled ?? true);
      setBackupSchedule(data.stats?.autoBackupSchedule || 'daily');
      setRetentionDays(String(data.stats?.retentionDays || 30));
    } catch {
      toast({ title: 'Error', description: 'Failed to load backup data', variant: 'destructive' });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchBackups(); }, [fetchBackups]);

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'manual' }),
      });
      const data = await res.json();
      if (data.success && data.backup.status === 'completed') {
        toast({ title: 'Backup Created', description: `${data.backup.filename} created successfully` });
      } else {
        toast({ title: 'Backup Failed', description: data.message || 'Could not create backup', variant: 'destructive' });
      }
      fetchBackups();
    } catch {
      toast({ title: 'Error', description: 'Failed to create backup', variant: 'destructive' });
    }
    setCreating(false);
  };

  const handleDeleteBackup = async () => {
    if (!deleteBackup) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/backup?id=${deleteBackup.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Deleted', description: data.message });
        setDeleteOpen(false);
        fetchBackups();
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete backup', variant: 'destructive' });
    }
    setDeleting(false);
  };

  const formatDate = (ts: string) => format(new Date(ts), 'dd MMM yyyy, HH:mm');
  const formatDateShort = (ts: string) => format(new Date(ts), 'dd MMM yyyy');
  const formatTime = (ts: string) => format(new Date(ts), 'HH:mm:ss');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-100 text-emerald-700 text-[10px] gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 text-[10px] gap-1"><XCircle className="w-3 h-3" /> Failed</Badge>;
      case 'in_progress':
        return <Badge className="bg-amber-100 text-amber-700 text-[10px] gap-1"><Zap className="w-3 h-3" /> In Progress</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'manual':
        return <Badge className="bg-slate-100 text-slate-600 text-[10px] gap-1"><FileArchive className="w-3 h-3" /> Manual</Badge>;
      case 'auto':
        return <Badge className="bg-violet-100 text-violet-700 text-[10px] gap-1"><Clock className="w-3 h-3" /> Auto</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{type}</Badge>;
    }
  };

  const completedCount = backups.filter((b) => b.status === 'completed').length;
  const successRate = stats.totalBackups > 0 ? Math.round((completedCount / stats.totalBackups) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Backup Management</h1>
              <p className="text-sm text-slate-500">Create and manage database backups</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBackups}
              className="gap-2 min-h-[38px]"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={handleCreateBackup}
              disabled={creating}
              className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] shadow-md gap-2"
            >
              {creating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Create Backup
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-slate-200/60 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <FileArchive className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Backups</p>
                <p className="text-xl font-bold">{stats.totalBackups}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Latest Backup</p>
                {stats.latestBackup ? (
                  <p className="text-sm font-bold text-blue-600">
                    {formatDateShort(stats.latestBackup.date)}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400">None</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Database Size</p>
                <p className="text-xl font-bold text-violet-600">{stats.databaseSize}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                {stats.autoBackupEnabled ? (
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500">Auto-Backup</p>
                <p className={`text-sm font-bold ${stats.autoBackupEnabled ? 'text-amber-600' : 'text-slate-400'}`}>
                  {stats.autoBackupEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Backup List */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-slate-200/60 overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-100 pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileArchive className="w-4 h-4 text-slate-500" />
                  Backup History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="space-y-3 p-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 rounded-lg" />
                    ))}
                  </div>
                ) : backups.length === 0 ? (
                  <div className="py-16 text-center">
                    <Database className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">No backups found</p>
                    <p className="text-slate-400 text-sm mt-1">Click &quot;Create Backup&quot; to create your first backup</p>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/50">
                            <TableHead className="text-xs font-semibold">Date & Time</TableHead>
                            <TableHead className="text-xs font-semibold">Filename</TableHead>
                            <TableHead className="text-xs font-semibold">Size</TableHead>
                            <TableHead className="text-xs font-semibold">Type</TableHead>
                            <TableHead className="text-xs font-semibold">Status</TableHead>
                            <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {backups.map((backup) => (
                            <TableRow
                              key={backup.id}
                              className={`hover:bg-slate-50 transition-colors ${backup.status === 'failed' ? 'bg-red-50/30' : ''}`}
                            >
                              <TableCell>
                                <div className="text-sm text-slate-700 font-medium">{formatDate(backup.created_at)}</div>
                                <div className="text-[10px] text-slate-400">{formatTime(backup.created_at)}</div>
                              </TableCell>
                              <TableCell>
                                <p className="text-xs text-slate-700 font-mono max-w-[220px] truncate">{backup.filename}</p>
                                {backup.status === 'completed' && (
                                  <p className="text-[10px] text-slate-400">{backup.tables} tables, {backup.records.toLocaleString()} records</p>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-slate-600">{backup.file_size}</TableCell>
                              <TableCell>{getTypeBadge(backup.type)}</TableCell>
                              <TableCell>{getStatusBadge(backup.status)}</TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-emerald-600"
                                    title="Download"
                                    disabled={backup.status !== 'completed'}
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-red-500"
                                    title="Delete"
                                    onClick={() => { setDeleteBackup(backup); setDeleteOpen(true); }}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden divide-y divide-slate-100">
                      {backups.map((backup) => (
                        <div key={backup.id} className={`p-4 space-y-2 ${backup.status === 'failed' ? 'bg-red-50/30' : ''}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-mono text-slate-700 truncate">{backup.filename}</p>
                              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                                <Calendar className="w-3 h-3" />
                                {formatDate(backup.created_at)}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {getTypeBadge(backup.type)}
                              {getStatusBadge(backup.status)}
                            </div>
                          </div>
                          {backup.status === 'completed' && (
                            <div className="flex items-center gap-3 text-[11px] text-slate-400">
                              <span>{backup.file_size}</span>
                              <span>{backup.tables} tables</span>
                              <span>{backup.records.toLocaleString()} records</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1 text-xs text-emerald-600"
                              disabled={backup.status !== 'completed'}
                            >
                              <Download className="w-3 h-3" /> Download
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 gap-1 text-xs text-red-500"
                              onClick={() => { setDeleteBackup(backup); setDeleteOpen(true); }}
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Database Info */}
            <Card className="border-slate-200/60">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Server className="w-4 h-4 text-slate-500" /> Database Information
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-6 rounded" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-xs text-slate-500">Engine</span>
                      <Badge variant="outline" className="text-[10px]">{dbInfo.engine}</Badge>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-xs text-slate-500">Version</span>
                      <span className="text-xs font-medium text-slate-700">{dbInfo.version}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-xs text-slate-500">Tables</span>
                      <span className="text-xs font-bold text-slate-700">{dbInfo.tables}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-xs text-slate-500">Total Records</span>
                      <span className="text-xs font-bold text-slate-700">{dbInfo.totalRecords.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-xs text-slate-500">Last Optimized</span>
                      <span className="text-xs text-slate-600">
                        {dbInfo.lastOptimized ? formatDateShort(dbInfo.lastOptimized) : '—'}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Backup Success Rate */}
            <Card className="border-slate-200/60">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-500" /> Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-emerald-600">{successRate}%</span>
                    <span className="text-xs text-slate-400">{completedCount}/{stats.totalBackups} completed</span>
                  </div>
                  <Progress value={successRate} className="h-2" />
                  <div className="flex items-center gap-4 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {completedCount} successful
                    </div>
                    <div className="flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-red-500" /> {stats.totalBackups - completedCount} failed
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Auto-backup Settings */}
            <Card className="border-slate-200/60">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-500" /> Auto-Backup Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-4">
                {/* Enable/Disable */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={autoBackupEnabled}
                      onCheckedChange={setAutoBackupEnabled}
                      id="auto-backup-toggle"
                    />
                    <div>
                      <Label htmlFor="auto-backup-toggle" className="text-sm font-medium cursor-pointer">
                        Auto-Backup
                      </Label>
                      <p className="text-[11px] text-slate-400">Schedule automatic backups</p>
                    </div>
                  </div>
                  {autoBackupEnabled ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-slate-300" />
                  )}
                </div>

                {/* Schedule */}
                {autoBackupEnabled && (
                  <>
                    <div className="grid gap-2">
                      <Label className="text-xs text-slate-500 font-medium">Schedule</Label>
                      <Select value={backupSchedule} onValueChange={setBackupSchedule}>
                        <SelectTrigger className="min-h-[40px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily (every day at 2:00 AM)</SelectItem>
                          <SelectItem value="weekly">Weekly (every Sunday at 2:00 AM)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label className="text-xs text-slate-500 font-medium">Retention Policy</Label>
                      <Select value={retentionDays} onValueChange={setRetentionDays}>
                        <SelectTrigger className="min-h-[40px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">Keep last 7 days</SelectItem>
                          <SelectItem value="14">Keep last 14 days</SelectItem>
                          <SelectItem value="30">Keep last 30 days</SelectItem>
                          <SelectItem value="60">Keep last 60 days</SelectItem>
                          <SelectItem value="90">Keep last 90 days</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-slate-400">Older backups will be automatically deleted</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ============ Delete Confirmation Dialog ============ */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Backup</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this backup? This action cannot be undone.
              <div className="mt-2 bg-slate-50 rounded-lg p-2">
                <p className="text-xs font-mono text-slate-600 break-all">{deleteBackup?.filename}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBackup}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? 'Deleting...' : 'Delete Backup'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
