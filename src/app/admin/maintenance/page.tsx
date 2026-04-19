'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Wrench, Plus, Pencil, Trash2, Search, X, AlertCircle, CheckCircle2, Clock, Loader2, MapPin, ArrowRight, Eye,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface MaintenanceRequest {
  id: number; title: string; description: string; priority: string; category: string;
  location: string; reported_by: string; status: string; created_at: string; updated_at: string;
}

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const CATEGORIES = ['Electrical', 'Plumbing', 'Structural', 'Furniture', 'IT', 'Other'];
const STATUSES = ['Open', 'In Progress', 'Completed', 'Closed'];

const STATUS_FLOW: Record<string, string> = {
  Open: 'In Progress',
  'In Progress': 'Completed',
  Completed: 'Closed',
};

/* ─── Stat Card Skeleton ─── */
function StatCardSkeleton() {
  return (
    <Card className="border-slate-200/60">
      <CardContent className="p-4 flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-12" />
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Content Skeleton ─── */
function ContentSkeleton() {
  return (
    <Card className="border-slate-200/60">
      <CardContent className="p-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-100 last:border-0">
            <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="w-20 h-8 rounded-md" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<MaintenanceRequest | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [form, setForm] = useState({
    title: '', description: '', priority: 'Medium', category: 'Other', location: '', reported_by: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/maintenance?action=stats');
      const data = await res.json();
      setRequests(data.requests || []);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setSelected(null);
    setForm({ title: '', description: '', priority: 'Medium', category: 'Other', location: '', reported_by: '' });
    setFormOpen(true);
  };

  const openEdit = (req: MaintenanceRequest) => {
    setSelected(req);
    setForm({
      title: req.title, description: req.description, priority: req.priority,
      category: req.category, location: req.location, reported_by: req.reported_by,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = selected
        ? { action: 'update', id: selected.id, ...form }
        : { action: 'create', ...form };
      await fetch('/api/admin/maintenance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      toast.success(selected ? 'Request updated successfully' : 'Request created successfully');
      setFormOpen(false);
      fetchData();
    } catch { toast.error('Failed to save request'); }
    setSaving(false);
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await fetch('/api/admin/maintenance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_status', id, status: newStatus }) });
      toast.success(`Status updated to ${newStatus}`);
      fetchData();
    } catch { toast.error('Invalid status transition'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/admin/maintenance?id=${deleteId}`, { method: 'DELETE' });
      toast.success('Request deleted');
      setDeleteOpen(false);
      fetchData();
    } catch { toast.error('Failed to delete request'); }
  };

  const filtered = requests.filter(r => {
    const matchSearch = search === '' || r.title.toLowerCase().includes(search.toLowerCase()) || r.location.toLowerCase().includes(search.toLowerCase()) || r.reported_by.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchPriority = filterPriority === 'all' || r.priority === filterPriority;
    const matchCategory = filterCategory === 'all' || r.category === filterCategory;
    return matchSearch && matchStatus && matchPriority && matchCategory;
  });

  const totalRequests = requests.length;
  const openCount = requests.filter(r => r.status === 'Open').length;
  const inProgress = requests.filter(r => r.status === 'In Progress').length;
  const completed = requests.filter(r => r.status === 'Completed' || r.status === 'Closed').length;

  const priorityColor = (priority: string) => {
    if (priority === 'Low') return 'bg-slate-50 text-slate-600 border-slate-200';
    if (priority === 'Medium') return 'bg-sky-50 text-sky-700 border-sky-200';
    if (priority === 'High') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (priority === 'Urgent') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  const statusColor = (status: string) => {
    if (status === 'Open') return 'bg-sky-50 text-sky-700 border-sky-200';
    if (status === 'In Progress') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (status === 'Completed') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'Closed') return 'bg-slate-50 text-slate-500 border-slate-200';
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  const statusIcon = (status: string) => {
    if (status === 'Open') return <AlertCircle className="w-3.5 h-3.5" />;
    if (status === 'In Progress') return <Loader2 className="w-3.5 h-3.5" />;
    if (status === 'Completed') return <CheckCircle2 className="w-3.5 h-3.5" />;
    return <CheckCircle2 className="w-3.5 h-3.5" />;
  };

  const activeFilters = (filterStatus !== 'all' ? 1 : 0) + (filterPriority !== 'all' ? 1 : 0) + (filterCategory !== 'all' ? 1 : 0) + (search ? 1 : 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Maintenance Management</h1>
            <p className="text-sm text-slate-500 mt-1">Track &amp; manage maintenance requests</p>
          </div>
          <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> New Request
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading ? (
            <><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>
          ) : (
            <>
              <Card className="border-l-4 border-l-slate-500 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Wrench className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">Total Requests</p>
                    <p className="text-xl font-bold text-slate-900">{totalRequests}</p>
                    <p className="text-[10px] text-slate-400">All time</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-sky-500 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-sky-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">Open</p>
                    <p className="text-xl font-bold text-slate-900">{openCount}</p>
                    <p className="text-[10px] text-sky-500 font-medium">{openCount > 0 ? 'Need attention' : 'All clear'}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">In Progress</p>
                    <p className="text-xl font-bold text-slate-900">{inProgress}</p>
                    <p className="text-[10px] text-slate-400">Being worked on</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-emerald-500 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">Completed</p>
                    <p className="text-xl font-bold text-slate-900">{completed}</p>
                    <p className="text-[10px] text-emerald-500 font-medium">
                      {totalRequests > 0 ? Math.round((completed / totalRequests) * 100) : 0}% resolved
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Status Workflow Visual */}
        {!loading && requests.length > 0 && (
          <Card className="border-slate-200/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2 overflow-x-auto">
                {STATUSES.map((s, i) => {
                  const count = requests.filter(r => r.status === s).length;
                  const isActive = count > 0;
                  return (
                    <div key={s} className="flex items-center gap-2">
                      <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-colors ${isActive ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100 opacity-50'}`}>
                        {statusIcon(s)}
                        <span className="text-xs font-medium text-slate-700">{s}</span>
                        <Badge variant="secondary" className={`text-[10px] ml-1 ${isActive ? '' : 'bg-slate-100'}`}>{count}</Badge>
                      </div>
                      {i < STATUSES.length - 1 && <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter Bar */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search requests by title, location, or reporter..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white"
              />
              {search && (
                <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0" onClick={() => setSearch('')}>
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[140px] min-h-[44px] bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-full sm:w-[130px] min-h-[44px] bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="hidden sm:flex w-[140px] min-h-[44px] bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Category</SelectItem>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters */}
          {activeFilters > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500">Active filters:</span>
              {search && (
                <Badge variant="secondary" className="text-xs h-6 gap-1">
                  &ldquo;{search}&rdquo;
                  <button onClick={() => setSearch('')} className="hover:text-slate-700"><X className="w-3 h-3" /></button>
                </Badge>
              )}
              {filterStatus !== 'all' && (
                <Badge variant="secondary" className="text-xs h-6 gap-1">
                  {filterStatus}
                  <button onClick={() => setFilterStatus('all')} className="hover:text-slate-700"><X className="w-3 h-3" /></button>
                </Badge>
              )}
              {filterPriority !== 'all' && (
                <Badge variant="secondary" className="text-xs h-6 gap-1">
                  {filterPriority}
                  <button onClick={() => setFilterPriority('all')} className="hover:text-slate-700"><X className="w-3 h-3" /></button>
                </Badge>
              )}
              {filterCategory !== 'all' && (
                <Badge variant="secondary" className="text-xs h-6 gap-1">
                  {filterCategory}
                  <button onClick={() => setFilterCategory('all')} className="hover:text-slate-700"><X className="w-3 h-3" /></button>
                </Badge>
              )}
              <button onClick={() => { setSearch(''); setFilterStatus('all'); setFilterPriority('all'); setFilterCategory('all'); }} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Data */}
        {loading ? (
          <ContentSkeleton />
        ) : filtered.length === 0 ? (
          <Card className="py-16 border-slate-200/60">
            <CardContent className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Wrench className="w-8 h-8 text-slate-300" />
              </div>
              <div className="text-center">
                <p className="text-slate-500 font-medium">No maintenance requests found</p>
                <p className="text-sm text-slate-400 mt-1">
                  {activeFilters > 0 ? 'Try adjusting your filters' : 'Create your first maintenance request'}
                </p>
              </div>
              {activeFilters === 0 && (
                <Button onClick={openCreate} variant="outline" className="mt-2 min-h-[44px]">
                  <Plus className="w-4 h-4 mr-2" /> New Request
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table */}
            <Card className="border-slate-200/60 hidden md:block">
              <CardContent className="p-0">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs text-slate-500">Showing {filtered.length} of {requests.length} requests</p>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-xs font-semibold text-slate-600">Request</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Category</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Priority</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Location</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Date</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 w-28">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(req => (
                        <TableRow key={req.id}>
                          <TableCell>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-slate-900">{req.title}</p>
                              <p className="text-xs text-slate-400 max-w-[200px] truncate">{req.description || 'No description'}</p>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline" className="text-xs border-slate-200">{req.category}</Badge></TableCell>
                          <TableCell><Badge variant="outline" className={`text-xs ${priorityColor(req.priority)}`}>{req.priority}</Badge></TableCell>
                          <TableCell className="text-sm">
                            {req.location ? (
                              <span className="flex items-center gap-1 text-slate-600"><MapPin className="w-3 h-3 flex-shrink-0" />{req.location}</span>
                            ) : <span className="text-slate-400">&mdash;</span>}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className={`text-xs ${statusColor(req.status)}`}>{req.status}</Badge>
                              {STATUS_FLOW[req.status] && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                                      <ArrowRight className="w-3 h-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleStatusChange(req.id, STATUS_FLOW[req.status])}>
                                      Move to {STATUS_FLOW[req.status]}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">{format(new Date(req.created_at), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 min-w-[32px]" onClick={() => { setSelected(req); setViewOpen(true); }}><Eye className="w-3.5 h-3.5" /></Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 min-w-[32px]" onClick={() => openEdit(req)}><Pencil className="w-3.5 h-3.5" /></Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 min-w-[32px] text-red-500 hover:bg-red-50" onClick={() => { setDeleteId(req.id); setDeleteOpen(true); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {filtered.map(req => (
                <Card key={req.id} className="border-slate-200/60">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-900">{req.title}</p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{req.description || 'No description'}</p>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ml-2 flex-shrink-0 ${priorityColor(req.priority)}`}>{req.priority}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <Badge variant="outline" className="text-[10px] border-slate-200">{req.category}</Badge>
                      {req.location && (
                        <Badge variant="outline" className="text-[10px] border-slate-200">
                          <MapPin className="w-2.5 h-2.5 mr-0.5" />{req.location}
                        </Badge>
                      )}
                      <Badge variant="outline" className={`text-[10px] ${statusColor(req.status)}`}>
                        {statusIcon(req.status)}<span className="ml-1">{req.status}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-3">
                      <span>{format(new Date(req.created_at), 'MMM d, yyyy')}{req.reported_by ? ` \u00b7 ${req.reported_by}` : ''}</span>
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                      <Button variant="outline" size="sm" className="h-9 text-xs flex-1 min-h-[44px]" onClick={() => { setSelected(req); setViewOpen(true); }}>
                        <Eye className="w-3.5 h-3.5 mr-1.5" />View
                      </Button>
                      {STATUS_FLOW[req.status] && (
                        <Button variant="outline" size="sm" className="h-9 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 min-h-[44px]" onClick={() => handleStatusChange(req.id, STATUS_FLOW[req.status])}>
                          <ArrowRight className="w-3.5 h-3.5 mr-1" />{STATUS_FLOW[req.status]}
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="h-9 w-9 text-xs min-h-[44px]" onClick={() => openEdit(req)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-9 w-9 text-xs text-red-500 min-h-[44px]" onClick={() => { setDeleteId(req.id); setDeleteOpen(true); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* View Request Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Eye className="w-4 h-4 text-amber-600" />
              </div>
              Request Details
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="font-bold text-lg text-slate-900">{selected.title}</p>
                <p className="text-sm text-slate-500 mt-1">{selected.description || 'No description provided'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] text-slate-500">Priority</span>
                  </div>
                  <Badge variant="outline" className={`text-xs ${priorityColor(selected.priority)}`}>{selected.priority}</Badge>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Wrench className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] text-slate-500">Category</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900">{selected.category}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] text-slate-500">Location</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900">{selected.location || '\u2014'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] text-slate-500">Status</span>
                  </div>
                  <Badge variant="outline" className={`text-xs ${statusColor(selected.status)}`}>
                    {statusIcon(selected.status)}<span className="ml-1">{selected.status}</span>
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>Created: {format(new Date(selected.created_at), 'MMM d, yyyy')}</span>
                {selected.updated_at && <span>Updated: {format(new Date(selected.updated_at), 'MMM d, yyyy')}</span>}
              </div>
              {selected.reported_by && (
                <p className="text-xs text-slate-500">Reported by: <span className="font-medium text-slate-700">{selected.reported_by}</span></p>
              )}
              {STATUS_FLOW[selected.status] && (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
                  onClick={() => { handleStatusChange(selected.id, STATUS_FLOW[selected.status]); setViewOpen(false); }}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />Move to {STATUS_FLOW[selected.status]}
                </Button>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { if (selected) openEdit(selected); setViewOpen(false); }} className="min-h-[44px]">
              <Pencil className="w-4 h-4 mr-2" />Edit
            </Button>
            <Button variant="outline" onClick={() => setViewOpen(false)} className="min-h-[44px]">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Wrench className="w-4 h-4 text-emerald-600" />
              </div>
              {selected ? 'Edit Request' : 'New Maintenance Request'}
            </DialogTitle>
            <DialogDescription>{selected ? 'Update the maintenance request details' : 'Describe the issue and set priority'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Title <span className="text-red-500">*</span></Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Brief title for the issue" className="min-h-[44px]" />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Detailed description of the issue" className="min-h-[80px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Location</Label>
                <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g., Block A, Room 101" className="min-h-[44px]" />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Reported By</Label>
                <Input value={form.reported_by} onChange={e => setForm({ ...form, reported_by: e.target.value })} placeholder="Name of reporter" className="min-h-[44px]" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setFormOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]" disabled={!form.title.trim() || saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selected ? 'Update Request' : 'Create Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              Delete Request
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this maintenance request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 min-h-[44px]">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
