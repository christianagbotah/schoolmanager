'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  UserPlus, Search, CheckCircle, XCircle, Trash2, Users, Percent, GraduationCap,
  ArrowRight, RefreshCw,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface Profile { profile_id: number; profile_name: string; discount_category: string; flat_amount: number; flat_percentage: number; }
interface Student { student_id: number; name: string; student_code: string; }
interface Assignment {
  assignment_id: number;
  student: { student_id: number; name: string; student_code: string };
  profile: { profile_id: number; profile_name: string; flat_amount: number; flat_percentage: number };
  is_active: number; year: string; term: string;
}

function fmt(n: number) { return `GH₵ ${(n || 0).toFixed(2)}`; }

export default function ApplyDiscountPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [recentAssignments, setRecentAssignments] = useState<Assignment[]>([]);
  const [runningYear, setRunningYear] = useState('');
  const [runningTerm, setRunningTerm] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0 });
  const [loading, setLoading] = useState(true);

  // Assign dialog
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignProfileId, setAssignProfileId] = useState('');
  const [assignSearch, setAssignSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [searching, setSearching] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/discounts/apply');
      const data = await res.json();
      setProfiles(data.profiles || []);
      setRecentAssignments(data.recentAssignments || []);
      setRunningYear(data.runningYear || '');
      setRunningTerm(data.runningTerm || '');
      setStats(data.stats || { total: 0, active: 0 });
    } catch { toast.error('Failed to load data'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = async (query: string) => {
    setAssignSearch(query);
    if (query.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch('/api/admin/discounts/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search_student', query }),
      });
      const data = await res.json();
      setSearchResults(data.students || []);
    } catch { /* silent */ }
    setSearching(false);
  };

  const toggleStudent = (id: number) => {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleApply = async () => {
    if (selectedStudents.length === 0 || !assignProfileId) {
      toast.error('Select students and a profile');
      return;
    }
    setAssigning(true);
    try {
      const profile = profiles.find(p => p.profile_id === parseInt(assignProfileId));
      const res = await fetch('/api/admin/discounts/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply',
          student_ids: selectedStudents,
          profile_id: parseInt(assignProfileId),
          discount_category: profile?.discount_category || 'daily_fees',
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setAssignOpen(false);
      setSelectedStudents([]);
      setAssignSearch('');
      setSearchResults([]);
      setAssignProfileId('');
      fetchData();
    } catch (err: any) { toast.error(err.message); }
    setAssigning(false);
  };

  const handleToggle = async (assignmentId: number) => {
    try {
      const res = await fetch('/api/admin/discounts/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', assignment_id: assignmentId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      fetchData();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleRemove = async (assignmentId: number) => {
    try {
      const res = await fetch(`/api/admin/discounts/apply?id=${assignmentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      fetchData();
    } catch (err: any) { toast.error(err.message); }
  };

  const activeProfiles = profiles.filter(p => p.is_active !== 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Apply Discount</h1>
              <p className="text-sm text-slate-500 mt-0.5">{runningYear} · Term {runningTerm}</p>
            </div>
          </div>
          <Button onClick={() => setAssignOpen(true)} className="bg-violet-600 hover:bg-violet-700">
            <UserPlus className="w-4 h-4 mr-2" /> Apply Discount
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
          <Card><CardContent className="p-4"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center"><Users className="w-4 h-4 text-violet-600" /></div><div><p className="text-[10px] text-slate-400">Total Assignments</p><p className="text-lg font-bold">{stats.total}</p></div></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-emerald-600" /></div><div><p className="text-[10px] text-slate-400">Active Discounts</p><p className="text-lg font-bold text-emerald-600">{stats.active}</p></div></div></CardContent></Card>
        </div>

        {/* Recent Assignments */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-slate-400" /> Recent Assignments
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={fetchData}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : recentAssignments.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No discount assignments yet</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setAssignOpen(true)}>
                  <UserPlus className="w-3.5 h-3.5 mr-1" /> Apply First Discount
                </Button>
              </div>
            ) : (
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-2">
                  {recentAssignments.map(a => (
                    <div key={a.assignment_id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${a.is_active ? 'bg-white border-emerald-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="w-4 h-4 text-violet-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{a.student?.name || 'Unknown'}</p>
                          <p className="text-[10px] text-slate-400">{a.student?.student_code} · {a.year}/{a.term}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200 text-[10px] h-5">
                          {a.profile?.profile_name || '—'}
                        </Badge>
                        <span className="font-mono text-[10px] font-medium">
                          {a.profile?.flat_percentage > 0 ? `${a.profile.flat_percentage}%` : fmt(a.profile?.flat_amount || 0)}
                        </span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggle(a.assignment_id)}>
                          {a.is_active ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-slate-400" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleRemove(a.assignment_id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Apply Dialog */}
        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Apply Discount to Students</DialogTitle>
              <DialogDescription>Search students and select a discount profile</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Profile Selection */}
              <div>
                <Label className="text-xs font-medium">Discount Profile *</Label>
                <Select value={assignProfileId} onValueChange={setAssignProfileId}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select profile..." /></SelectTrigger>
                  <SelectContent>
                    {activeProfiles.map(p => (
                      <SelectItem key={p.profile_id} value={String(p.profile_id)}>
                        {p.profile_name} — {p.flat_percentage > 0 ? `${p.flat_percentage}%` : fmt(p.flat_amount)} ({p.discount_category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Student Search */}
              <div>
                <Label className="text-xs font-medium">Search Students *</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Type name or student code..."
                    value={assignSearch}
                    onChange={e => handleSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {searchResults.map(s => (
                    <button
                      key={s.student_id}
                      onClick={() => toggleStudent(s.student_id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left text-xs hover:bg-slate-50 transition-colors ${selectedStudents.includes(s.student_id) ? 'bg-violet-50' : ''}`}
                    >
                      <Checkbox checked={selectedStudents.includes(s.student_id)} />
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-[10px] text-slate-400">{s.student_code}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Count */}
              {selectedStudents.length > 0 && (
                <div className="flex items-center gap-2 p-2 bg-violet-50 rounded-lg">
                  <Users className="w-4 h-4 text-violet-600" />
                  <span className="text-xs font-medium text-violet-700">{selectedStudents.length} student(s) selected</span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
              <Button onClick={handleApply} disabled={assigning || selectedStudents.length === 0 || !assignProfileId} className="bg-violet-600 hover:bg-violet-700">
                {assigning ? 'Applying...' : 'Apply Discount'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
