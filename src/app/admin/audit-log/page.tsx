'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis,
} from '@/components/ui/pagination';
import {
  Shield, Search, Filter, Activity, AlertTriangle, Clock, Users,
  ChevronDown, X, RefreshCw, Eye, ChevronLeft, ChevronRight,
  FileText, Globe, Pencil, Trash2, LogIn, Download, Zap,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AuditLog {
  id: number;
  timestamp: string;
  user: string;
  role: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'export' | 'error';
  description: string;
  ip_address: string;
  details: Record<string, string> | null;
}

interface AuditStats {
  total: number;
  todayActivity: number;
  mostActiveUser: string;
  errorCount: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ACTION_CONFIG: Record<string, { icon: typeof FileText; badgeClass: string; label: string }> = {
  create: { icon: FileText, badgeClass: 'bg-amber-100 text-amber-700', label: 'Create' },
  update: { icon: Pencil, badgeClass: 'bg-blue-100 text-blue-700', label: 'Update' },
  delete: { icon: Trash2, badgeClass: 'bg-red-100 text-red-700', label: 'Delete' },
  login: { icon: LogIn, badgeClass: 'bg-emerald-100 text-emerald-700', label: 'Login' },
  export: { icon: Download, badgeClass: 'bg-violet-100 text-violet-700', label: 'Export' },
  error: { icon: AlertTriangle, badgeClass: 'bg-red-100 text-red-600', label: 'Error' },
};

const ROLE_BADGES: Record<string, string> = {
  admin: 'bg-slate-700 text-white',
  teacher: 'bg-sky-100 text-sky-700',
  accountant: 'bg-amber-100 text-amber-700',
  librarian: 'bg-purple-100 text-purple-700',
  system: 'bg-zinc-200 text-zinc-600',
};

export default function AuditLogPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats>({ total: 0, todayActivity: 0, mostActiveUser: '—', errorCount: 0 });
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionType, setActionType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLog, setViewLog] = useState<AuditLog | null>(null);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (search) params.set('search', search);
      if (actionType) params.set('actionType', actionType);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      const res = await fetch(`/api/admin/audit-log?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setStats(data.stats || { total: 0, todayActivity: 0, mostActiveUser: '—', errorCount: 0 });
      setPagination(data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
      setLastRefresh(new Date());
    } catch {
      toast({ title: 'Error', description: 'Failed to load audit logs', variant: 'destructive' });
    }
    setLoading(false);
  }, [search, actionType, dateFrom, dateTo, toast]);

  useEffect(() => {
    fetchLogs(1);
  }, [actionType, dateFrom, dateTo, fetchLogs]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchLogs(1);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshRef.current = setInterval(() => {
        fetchLogs(pagination.page);
      }, 30000);
    }
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, [autoRefresh, pagination.page, fetchLogs]);

  const clearFilters = () => {
    setSearch('');
    setActionType('');
    setDateFrom('');
    setDateTo('');
    setDateFilterOpen(false);
  };

  const goToPage = (page: number) => {
    fetchLogs(page);
  };

  const formatTimestamp = (ts: string) => {
    return format(new Date(ts), 'dd MMM yyyy, HH:mm:ss');
  };

  const formatShortTimestamp = (ts: string) => {
    return format(new Date(ts), 'dd MMM, HH:mm');
  };

  const getActionBadge = (action: string) => {
    const config = ACTION_CONFIG[action] || ACTION_CONFIG.update;
    const Icon = config.icon;
    return (
      <Badge className={`${config.badgeClass} text-[10px] font-semibold gap-1 px-2 py-0.5`}>
        <Icon className="w-3 h-3" /> {config.label}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    return (
      <Badge className={`${ROLE_BADGES[role] || 'bg-slate-100 text-slate-600'} text-[9px] px-1.5 py-0`}>
        {role}
      </Badge>
    );
  };

  // Pagination page numbers
  const getPageNumbers = () => {
    const { page, totalPages } = pagination;
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('ellipsis');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Trail</h1>
              <p className="text-sm text-slate-500">Monitor system activity and user actions</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Auto-refresh toggle */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <Switch
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
                id="auto-refresh"
              />
              <Label htmlFor="auto-refresh" className="text-xs font-medium text-slate-600 cursor-pointer">
                Auto-refresh 30s
              </Label>
              {autoRefresh && (
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLogs(pagination.page)}
              className="gap-2 min-h-[38px]"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Last refresh indicator */}
        {lastRefresh && (
          <p className="text-[11px] text-slate-400 -mt-4 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last updated: {format(lastRefresh, 'HH:mm:ss')}
          </p>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-slate-200/60 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Logs</p>
                <p className="text-xl font-bold">{stats.total.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Today&apos;s Activity</p>
                <p className="text-xl font-bold text-emerald-600">{stats.todayActivity}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Most Active User</p>
                <p className="text-sm font-bold text-blue-600 truncate">{stats.mostActiveUser}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Error Count</p>
                <p className="text-xl font-bold text-red-600">{stats.errorCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card className="border-slate-200/60">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by user, action, or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 min-h-[44px]"
                />
              </div>

              {/* Action Type Filter */}
              <Select value={actionType} onValueChange={(v) => setActionType(v === '__all__' ? '' : v)}>
                <SelectTrigger className="w-full sm:w-[160px] min-h-[44px]">
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="export">Export</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range Filter */}
              <Popover open={dateFilterOpen} onOpenChange={setDateFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2 min-h-[44px] w-full sm:w-auto">
                    <Filter className="w-4 h-4" />
                    {dateFrom || dateTo ? 'Date Filter Active' : 'Date Range'}
                    {(dateFrom || dateTo) && (
                      <Badge className="bg-slate-700 text-white text-[10px] ml-1">On</Badge>
                    )}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-slate-900">Filter by Date Range</h4>
                    <div className="grid gap-2">
                      <Label className="text-xs text-slate-500">From</Label>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs text-slate-500">To</Label>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => { setDateFilterOpen(false); fetchLogs(1); }}
                        className="flex-1 bg-slate-700 hover:bg-slate-800"
                      >
                        Apply
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setDateFrom(''); setDateTo(''); }}
                        className="gap-1"
                      >
                        <X className="w-3 h-3" /> Clear
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Clear All */}
              {(search || actionType || dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-slate-500 min-h-[44px]">
                  <X className="w-4 h-4" /> Clear All
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {logs.length} of {pagination.total} entries
            {actionType && (
              <Badge variant="outline" className="ml-2 text-[10px] capitalize">{actionType}</Badge>
            )}
          </p>
        </div>

        {/* Log List - Desktop Table */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <Card className="py-16">
            <CardContent className="flex flex-col items-center">
              <Shield className="w-16 h-16 text-slate-200 mb-4" />
              <p className="text-slate-500 font-medium">No audit logs found</p>
              <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table */}
            <Card className="border-slate-200/60 overflow-hidden hidden md:block">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-xs font-semibold w-12">#</TableHead>
                      <TableHead className="text-xs font-semibold min-w-[160px]">Timestamp</TableHead>
                      <TableHead className="text-xs font-semibold min-w-[180px]">User</TableHead>
                      <TableHead className="text-xs font-semibold w-[100px]">Action</TableHead>
                      <TableHead className="text-xs font-semibold min-w-[260px]">Description</TableHead>
                      <TableHead className="text-xs font-semibold w-[130px]">IP Address</TableHead>
                      <TableHead className="text-xs font-semibold text-right w-[70px]">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log, i) => (
                      <TableRow
                        key={log.id}
                        className={`hover:bg-slate-50 transition-colors ${log.action === 'error' ? 'bg-red-50/30' : ''}`}
                      >
                        <TableCell className="text-sm text-slate-500">{(pagination.page - 1) * pagination.limit + i + 1}</TableCell>
                        <TableCell className="text-sm text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatShortTimestamp(log.timestamp)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900">{log.user}</span>
                            {getRoleBadge(log.role)}
                          </div>
                        </TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell className="text-sm text-slate-600 max-w-[320px]">
                          <p className="line-clamp-1">{log.description}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Globe className="w-3 h-3 text-slate-400" />
                            <code className="text-xs text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">{log.ip_address}</code>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700"
                            onClick={() => { setViewLog(log); setViewOpen(true); }}
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {logs.map((log, i) => (
                <Card key={log.id} className={`border-slate-200/60 ${log.action === 'error' ? 'border-red-200' : ''}`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-semibold text-slate-900 truncate">{log.user}</span>
                        {getRoleBadge(log.role)}
                      </div>
                      {getActionBadge(log.action)}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">{log.description}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatShortTimestamp(log.timestamp)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        <code className="bg-slate-50 px-1 rounded">{log.ip_address}</code>
                      </div>
                    </div>
                    {log.details && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-8 text-xs text-slate-500 gap-1"
                        onClick={() => { setViewLog(log); setViewOpen(true); }}
                      >
                        <Eye className="w-3 h-3" /> View Details
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center pt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => pagination.page > 1 && goToPage(pagination.page - 1)}
                        className={pagination.page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {getPageNumbers().map((p, idx) =>
                      p === 'ellipsis' ? (
                        <PaginationItem key={`ellipsis-${idx}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={p}>
                          <PaginationLink
                            isActive={p === pagination.page}
                            onClick={() => goToPage(p as number)}
                            className="cursor-pointer"
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => pagination.page < pagination.totalPages && goToPage(pagination.page + 1)}
                        className={pagination.page >= pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>

      {/* ============ View Details Dialog ============ */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {viewLog && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  {getActionBadge(viewLog.action)}
                  Log Entry #{viewLog.id}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-1 text-sm">
                  <Clock className="w-3.5 h-3.5" />
                  {formatTimestamp(viewLog.timestamp)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                {/* User Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">User</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{viewLog.user}</span>
                      {getRoleBadge(viewLog.role)}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">IP Address</p>
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <code className="text-sm text-slate-700">{viewLog.ip_address}</code>
                    </div>
                  </div>
                </div>

                {/* Action */}
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Action</p>
                  {getActionBadge(viewLog.action)}
                </div>

                {/* Description */}
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Description</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{viewLog.description}</p>
                </div>

                {/* Details (if present) */}
                {viewLog.details && Object.keys(viewLog.details).length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">Additional Details</p>
                    <div className="space-y-2">
                      {Object.entries(viewLog.details).map(([key, value]) => (
                        <div key={key}>
                          <p className="text-[10px] text-slate-500 font-medium capitalize mb-0.5">{key.replace(/_/g, ' ')}</p>
                          <pre className="text-xs text-slate-700 bg-white rounded p-2 overflow-x-auto border border-slate-100">
                            {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
