"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle, BookCheck, BookOpen, CheckCircle, XCircle, Clock,
  Loader2, RotateCcw, Search, BookPlus, Ban,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface RequestItem {
  book_request_id: number;
  status: string;
  issue_start_date: string | null;
  issue_end_date: string | null;
  book: { book_id: number; name: string; author: string; total_copies: number; issued_copies: number };
  student: { student_id: number; name: string; student_code: string };
}

interface StudentItem { student_id: number; student_code: string; name: string; }
interface BookItem { book_id: number; name: string; author: string; total_copies: number; issued_copies: number; }

interface RequestStats {
  total: number; pending: number; issued: number; returned: number; rejected: number; overdue: number;
}

// ─── Status badge ───────────────────────────────────────────
function statusBadge(status: string, isOverdue: boolean) {
  if (isOverdue) return <Badge className="bg-red-100 text-red-700">Overdue</Badge>;
  switch (status) {
    case "pending": return <Badge className="bg-blue-100 text-blue-700">Pending</Badge>;
    case "issued": return <Badge className="bg-emerald-100 text-emerald-700">Issued</Badge>;
    case "returned": return <Badge className="bg-slate-100 text-slate-700">Returned</Badge>;
    case "rejected": return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
    default: return <Badge variant="secondary">{status}</Badge>;
  }
}

// ─── Main Component ──────────────────────────────────────────
export default function LibrarianRequestsPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [stats, setStats] = useState<RequestStats | null>(null);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Issue dialog
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [issueStudent, setIssueStudent] = useState("");
  const [issueBook, setIssueBook] = useState("");
  const [issueEndDate, setIssueEndDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; request: RequestItem } | null>(null);

  // Return dialog
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnRequest, setReturnRequest] = useState<RequestItem | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/book-requests?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setRequests(data.data || []);
      setStats(data.stats || null);
    } catch {
      setError("Failed to load requests");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchRequests();
    fetch("/api/students?limit=200").then(r => r.ok ? r.json() : { students: [] }).then(d => setStudents(d.students || [])).catch(() => {});
    fetch("/api/books").then(r => r.ok ? r.json() : { data: [] }).then(d => setBooks(d.data || [])).catch(() => {});
  }, [fetchRequests]);

  const handleAction = (type: string, request: RequestItem) => {
    setConfirmAction({ type, request });
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!confirmAction?.request) return;
    const { type, request } = confirmAction;
    setIsSaving(true);
    try {
      const res = await fetch("/api/book-requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book_request_id: request.book_request_id, status: type }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      const actionLabel = type === "issued" ? "approved" : type === "rejected" ? "rejected" : type === "returned" ? "recorded return for" : "updated";
      toast({ title: "Success", description: `Request ${actionLabel} successfully` });
      setConfirmOpen(false);
      setConfirmAction(null);
      fetchRequests();
    } catch (err) {
      toast({ title: "Error", variant: "destructive", description: err instanceof Error ? err.message : "Action failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReturn = async () => {
    if (!returnRequest) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/book-requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book_request_id: returnRequest.book_request_id, status: "returned" }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Success", description: "Book return recorded successfully" });
      setReturnDialogOpen(false);
      setReturnRequest(null);
      fetchRequests();
    } catch {
      toast({ title: "Error", variant: "destructive", description: "Failed to record return" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewIssue = async () => {
    if (!issueStudent || !issueBook) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/book-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          book_id: parseInt(issueBook),
          student_id: parseInt(issueStudent),
          issue_end_date: issueEndDate || null,
          status: "issued",
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed");
      }
      toast({ title: "Success", description: "Book issued successfully" });
      setIssueDialogOpen(false);
      setIssueStudent(""); setIssueBook(""); setIssueEndDate("");
      fetchRequests();
    } catch (err) {
      toast({ title: "Error", variant: "destructive", description: err instanceof Error ? err.message : "Failed to issue book" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Book Requests</h1>
            <p className="text-sm text-slate-500 mt-1">Approve issues, record returns, and manage book requests</p>
          </div>
          <Button onClick={() => setIssueDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]">
            <BookPlus className="w-4 h-4 mr-2" />Issue Book
          </Button>
        </div>

        {/* Stats (matching CI3) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="py-3 border-l-4 border-l-slate-400"><CardContent className="px-3 pt-0 pb-0"><p className="text-[10px] font-medium text-slate-500 uppercase">Total</p><p className="text-lg font-bold text-slate-900">{stats?.total || 0}</p></CardContent></Card>
          <Card className="py-3 border-l-4 border-l-blue-500"><CardContent className="px-3 pt-0 pb-0"><p className="text-[10px] font-medium text-slate-500 uppercase">Pending</p><p className="text-lg font-bold text-blue-600">{stats?.pending || 0}</p></CardContent></Card>
          <Card className="py-3 border-l-4 border-l-emerald-500"><CardContent className="px-3 pt-0 pb-0"><p className="text-[10px] font-medium text-slate-500 uppercase">Issued</p><p className="text-lg font-bold text-emerald-600">{stats?.issued || 0}</p></CardContent></Card>
          <Card className="py-3 border-l-4 border-l-amber-500"><CardContent className="px-3 pt-0 pb-0"><p className="text-[10px] font-medium text-slate-500 uppercase">Overdue</p><p className="text-lg font-bold text-amber-600">{stats?.overdue || 0}</p></CardContent></Card>
          <Card className="py-3 border-l-4 border-l-slate-300"><CardContent className="px-3 pt-0 pb-0"><p className="text-[10px] font-medium text-slate-500 uppercase">Returned</p><p className="text-lg font-bold text-slate-700">{stats?.returned || 0}</p></CardContent></Card>
          <Card className="py-3 border-l-4 border-l-red-500"><CardContent className="px-3 pt-0 pb-0"><p className="text-[10px] font-medium text-slate-500 uppercase">Rejected</p><p className="text-lg font-bold text-red-600">{stats?.rejected || 0}</p></CardContent></Card>
        </div>

        {/* Filters */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input placeholder="Search by book or student..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Filter by Status</Label>
                <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="issued">Issued</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
          </div>
        )}

        {/* Table (matching CI3 book_request2.php) */}
        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center"><BookCheck className="w-4 h-4 text-rose-600" /></div>
              <CardTitle className="text-base font-semibold">All Requests ({requests.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12"><BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No book requests found</p></div>
            ) : (
              <>
                {/* Desktop view */}
                <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200 max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase w-12">#</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase">Book</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden lg:table-cell">Issue Date</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden lg:table-cell">Due Date</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Status</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Options</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((r, idx) => {
                        const isOverdue = r.status === "issued" && r.issue_end_date && new Date(r.issue_end_date) < new Date();
                        const isPending = r.status === "pending";
                        const isIssued = r.status === "issued";
                        return (
                          <TableRow key={r.book_request_id} className={`hover:bg-slate-50 ${isOverdue ? "bg-red-50/50" : isPending ? "bg-blue-50/30" : ""}`}>
                            <TableCell className="text-slate-400 text-sm">{idx + 1}</TableCell>
                            <TableCell className="font-medium text-sm">{r.book?.name || "—"}</TableCell>
                            <TableCell className="text-sm text-slate-600">{r.student?.name || "Unknown"}</TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-slate-500">{r.issue_start_date ? format(new Date(r.issue_start_date), "MMM d, yyyy") : "—"}</TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-slate-500">{r.issue_end_date ? format(new Date(r.issue_end_date), "MMM d, yyyy") : "—"}</TableCell>
                            <TableCell className="text-center">{statusBadge(r.status, isOverdue)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {isPending && (
                                  <>
                                    <Button variant="ghost" size="sm" className="h-8 text-xs text-emerald-700 hover:bg-emerald-50" onClick={() => handleAction("issued", r)}>
                                      <CheckCircle className="w-3.5 h-3.5 mr-1" />Accept
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-8 text-xs text-red-700 hover:bg-red-50" onClick={() => handleAction("rejected", r)}>
                                      <XCircle className="w-3.5 h-3.5 mr-1" />Reject
                                    </Button>
                                  </>
                                )}
                                {isIssued && (
                                  <Button variant="ghost" size="sm" className="h-8 text-xs text-amber-700 hover:bg-amber-50" onClick={() => { setReturnRequest(r); setReturnDialogOpen(true); }}>
                                    <RotateCcw className="w-3.5 h-3.5 mr-1" /><span className="hidden lg:inline">Return</span>
                                  </Button>
                                )}
                                {!isPending && !isIssued && (
                                  <span className="text-xs text-slate-400 italic">No actions</span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile view */}
                <div className="md:hidden space-y-3 max-h-[500px] overflow-y-auto">
                  {requests.map((r) => {
                    const isOverdue = r.status === "issued" && r.issue_end_date && new Date(r.issue_end_date) < new Date();
                    const isPending = r.status === "pending";
                    const isIssued = r.status === "issued";
                    return (
                      <div key={r.book_request_id} className={`p-4 rounded-lg border ${isOverdue ? "border-red-200 bg-red-50/30" : isPending ? "border-blue-200 bg-blue-50/30" : "border-slate-100"}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-sm text-slate-900">{r.book?.name || "—"}</h3>
                            <p className="text-xs text-slate-500">by {r.author || ""}</p>
                          </div>
                          {statusBadge(r.status, isOverdue)}
                        </div>
                        <p className="text-xs text-slate-600 mb-1">Student: <strong>{r.student?.name}</strong></p>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                          {r.issue_start_date && <span>Issued: {format(new Date(r.issue_start_date), "MMM d")}</span>}
                          {r.issue_end_date && <span>Due: {format(new Date(r.issue_end_date), "MMM d")}</span>}
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                          {isPending && (
                            <>
                              <Button size="sm" variant="outline" className="flex-1 h-9 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={() => handleAction("issued", r)}>
                                <CheckCircle className="w-3.5 h-3.5 mr-1" />Accept
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1 h-9 text-xs text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleAction("rejected", r)}>
                                <XCircle className="w-3.5 h-3.5 mr-1" />Reject
                              </Button>
                            </>
                          )}
                          {isIssued && (
                            <Button size="sm" variant="outline" className="w-full h-9 text-xs text-amber-700 border-amber-200 hover:bg-amber-50" onClick={() => { setReturnRequest(r); setReturnDialogOpen(true); }}>
                              <RotateCcw className="w-3.5 h-3.5 mr-1" />Record Return
                            </Button>
                          )}
                          {!isPending && !isIssued && (
                            <p className="text-xs text-slate-400 italic text-center w-full">No actions available</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Issue Book Dialog */}
        <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Issue New Book</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Student *</Label>
                <Select value={issueStudent} onValueChange={setIssueStudent}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>{students.map(s => <SelectItem key={s.student_id} value={String(s.student_id)}>{s.name} ({s.student_code})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Book *</Label>
                <Select value={issueBook} onValueChange={setIssueBook}>
                  <SelectTrigger><SelectValue placeholder="Select book" /></SelectTrigger>
                  <SelectContent>
                    {books.filter(b => (b.total_copies - b.issued_copies) > 0).map(b => (
                      <SelectItem key={b.book_id} value={String(b.book_id)}>
                        {b.name} by {b.author} ({b.total_copies - b.issued_copies} available)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={issueEndDate} onChange={(e) => setIssueEndDate(e.target.value)} />
              </div>
              <Button onClick={handleNewIssue} disabled={isSaving || !issueStudent || !issueBook} className="w-full bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BookCheck className="w-4 h-4 mr-2" />}
                Issue Book
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Return Dialog */}
        <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Book Return</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              {returnRequest && (
                <>
                  <div className="p-4 rounded-lg bg-slate-50 space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Student</span><span className="font-medium">{returnRequest.student?.name}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Book</span><span className="font-medium">{returnRequest.book?.name}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Author</span><span className="font-medium">{returnRequest.book?.author}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Issued</span><span className="font-medium">{returnRequest.issue_start_date ? format(new Date(returnRequest.issue_start_date), "MMM d, yyyy") : "—"}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Due</span><span className="font-medium">{returnRequest.issue_end_date ? format(new Date(returnRequest.issue_end_date), "MMM d, yyyy") : "—"}</span></div>
                  </div>
                  <Button onClick={handleReturn} disabled={isSaving} className="w-full bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Confirm Return
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirm Dialog for Accept/Reject */}
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmAction?.type === "issued" ? "Accept Book Request" : confirmAction?.type === "rejected" ? "Reject Book Request" : "Confirm Action"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmAction?.type === "issued" && (
                  <>Issue <strong>{confirmAction.request?.book?.name}</strong> to <strong>{confirmAction.request?.student?.name}</strong>? A copy will be marked as issued.</>
                )}
                {confirmAction?.type === "rejected" && (
                  <>Reject the book request for <strong>{confirmAction.request?.book?.name}</strong> from <strong>{confirmAction.request?.student?.name}</strong>? This action cannot be undone.</>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm}
                className={confirmAction?.type === "rejected" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {confirmAction?.type === "issued" ? "Accept" : "Reject"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
