"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle, BookCheck, BookOpen, CheckCircle, XCircle, Clock,
  Loader2, RotateCcw, Search, BookPlus, Calendar, Library,
  User, Filter, Eye, Trash2,
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
  book: { book_id: number; name: string; author: string; isbn: string; category: string; total_copies: number; issued_copies: number };
  student: { student_id: number; name: string; student_code: string };
}

interface StudentItem { student_id: number; student_code: string; name: string; }
interface BookItem { book_id: number; name: string; author: string; isbn: string; total_copies: number; issued_copies: number; }

interface RequestStats {
  total: number;
  pending: number;
  issued: number;
  returned: number;
  rejected: number;
  overdue: number;
}

// ─── Status badge ───────────────────────────────────────────
function statusBadge(status: string, isOverdue: boolean) {
  if (isOverdue) return <Badge className="bg-red-100 text-red-700 font-medium">Overdue</Badge>;
  switch (status) {
    case "pending": return <Badge className="bg-amber-100 text-amber-700 font-medium">Pending</Badge>;
    case "issued": return <Badge className="bg-sky-100 text-sky-700 font-medium">Issued</Badge>;
    case "returned": return <Badge className="bg-emerald-100 text-emerald-700 font-medium">Returned</Badge>;
    case "rejected": return <Badge className="bg-red-100 text-red-700 font-medium">Rejected</Badge>;
    default: return <Badge variant="secondary">{status}</Badge>;
  }
}

function isOverdueCheck(r: RequestItem): boolean {
  return r.status === "issued" && r.issue_end_date && new Date(r.issue_end_date) < new Date();
}

// ─── Main Component ──────────────────────────────────────────
export default function LibrarianRequestsPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [stats, setStats] = useState<RequestStats | null>(null);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Issue dialog
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [issueStudent, setIssueStudent] = useState("");
  const [issueBook, setIssueBook] = useState("");
  const [issueStartDate, setIssueStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [issueEndDate, setIssueEndDate] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; request: RequestItem } | null>(null);

  // Return dialog
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnRequest, setReturnRequest] = useState<RequestItem | null>(null);

  // View dialog
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingRequest, setViewingRequest] = useState<RequestItem | null>(null);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/librarian/requests?${params}`);
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
    fetch("/api/students?limit=500").then((r) => (r.ok ? r.json() : { students: [] })).then((d) => setStudents(d.students || [])).catch(() => {});
    fetch("/api/librarian/books?limit=500").then((r) => (r.ok ? r.json() : { data: [] })).then((d) => setBooks(d.data || [])).catch(() => {});
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
      const res = await fetch("/api/librarian/requests", {
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
      const res = await fetch("/api/librarian/requests", {
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

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/librarian/requests?id=${deletingId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Failed");
      }
      toast({ title: "Success", description: "Request deleted" });
      setDeleteOpen(false);
      setDeletingId(null);
      fetchRequests();
    } catch (err) {
      toast({ title: "Error", variant: "destructive", description: err instanceof Error ? err.message : "Failed to delete" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewIssue = async () => {
    if (!issueStudent || !issueBook) {
      toast({ title: "Error", variant: "destructive", description: "Select both student and book" });
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/librarian/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          book_id: parseInt(issueBook),
          student_id: parseInt(issueStudent),
          issue_start_date: issueStartDate || null,
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
      setIssueStudent("");
      setIssueBook("");
      setIssueStartDate(format(new Date(), "yyyy-MM-dd"));
      setIssueEndDate("");
      fetchRequests();
    } catch (err) {
      toast({ title: "Error", variant: "destructive", description: err instanceof Error ? err.message : "Failed to issue book" });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStudents = studentSearch
    ? students.filter((s) =>
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.student_code.toLowerCase().includes(studentSearch.toLowerCase())
      )
    : students;

  const availableBooks = books.filter((b) => b.total_copies - b.issued_copies > 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Header ─────────────────────────────────────── */}
        <div className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <BookCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Book Requests</h1>
                <p className="text-violet-100 text-sm">Approve issues, record returns, and manage requests</p>
              </div>
            </div>
            <Button onClick={() => setIssueDialogOpen(true)} className="bg-white text-violet-700 hover:bg-violet-50 font-semibold min-h-[44px]">
              <BookPlus className="w-4 h-4 mr-2" />Issue Book
            </Button>
          </div>
        </div>

        {/* ─── Stats Bar ──────────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            <Card className="py-3 border-l-4 border-l-slate-400">
              <CardContent className="px-3 pt-0 pb-0">
                <p className="text-[10px] font-medium text-slate-500 uppercase">Total</p>
                <p className="text-lg font-bold text-slate-900 tabular-nums">{stats.total}</p>
              </CardContent>
            </Card>
            <Card className="py-3 border-l-4 border-l-amber-500">
              <CardContent className="px-3 pt-0 pb-0">
                <p className="text-[10px] font-medium text-slate-500 uppercase">Pending</p>
                <p className="text-lg font-bold text-amber-600 tabular-nums">{stats.pending}</p>
              </CardContent>
            </Card>
            <Card className="py-3 border-l-4 border-l-sky-500">
              <CardContent className="px-3 pt-0 pb-0">
                <p className="text-[10px] font-medium text-slate-500 uppercase">Issued</p>
                <p className="text-lg font-bold text-sky-600 tabular-nums">{stats.issued}</p>
              </CardContent>
            </Card>
            <Card className="py-3 border-l-4 border-l-red-500">
              <CardContent className="px-3 pt-0 pb-0">
                <p className="text-[10px] font-medium text-slate-500 uppercase">Overdue</p>
                <p className="text-lg font-bold text-red-600 tabular-nums">{stats.overdue}</p>
              </CardContent>
            </Card>
            <Card className="py-3 border-l-4 border-l-emerald-500">
              <CardContent className="px-3 pt-0 pb-0">
                <p className="text-[10px] font-medium text-slate-500 uppercase">Returned</p>
                <p className="text-lg font-bold text-emerald-600 tabular-nums">{stats.returned}</p>
              </CardContent>
            </Card>
            <Card className="py-3 border-l-4 border-l-red-400">
              <CardContent className="px-3 pt-0 pb-0">
                <p className="text-[10px] font-medium text-slate-500 uppercase">Rejected</p>
                <p className="text-lg font-bold text-red-600 tabular-nums">{stats.rejected}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── Filters ────────────────────────────────────── */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative sm:col-span-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search by book or student..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
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
              {(search || (statusFilter !== "all")) && (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-xs text-slate-500 min-h-[44px]" onClick={() => { setSearch(""); setStatusFilter("all"); }}>
                    <Filter className="w-3 h-3 mr-1" />Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
          </div>
        )}

        {/* ─── Requests Table ─────────────────────────────── */}
        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                  <BookCheck className="w-4 h-4 text-violet-600" />
                </div>
                <CardTitle className="text-base font-semibold">
                  All Requests ({requests.length})
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No book requests found</p>
                <p className="text-slate-400 text-sm mt-1">
                  {statusFilter ? "Try a different filter or " : ""}
                  <button className="text-violet-600 hover:underline" onClick={() => setIssueDialogOpen(true)}>
                    Issue a book
                  </button>
                </p>
              </div>
            ) : (
              <>
                {/* Desktop view */}
                <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200 max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase w-12">#</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase">Book</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden lg:table-cell">Category</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden xl:table-cell">Issue Date</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden xl:table-cell">Due Date</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Status</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((r, idx) => {
                        const isOverdue = isOverdueCheck(r);
                        const isPending = r.status === "pending";
                        const isIssued = r.status === "issued";
                        return (
                          <TableRow key={r.book_request_id} className={`hover:bg-slate-50 ${isOverdue ? "bg-red-50/50" : isPending ? "bg-amber-50/30" : ""}`}>
                            <TableCell className="text-slate-400 text-sm">{idx + 1}</TableCell>
                            <TableCell>
                              <div className="min-w-0">
                                <p className="font-medium text-sm text-slate-900">{r.student?.name || "Unknown"}</p>
                                <p className="text-xs text-slate-400">{r.student?.student_code}</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-sm max-w-[180px] truncate">{r.book?.name || "—"}</TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {r.book?.category ? <Badge variant="outline" className="text-[10px]">{r.book.category}</Badge> : <span className="text-xs text-slate-400">—</span>}
                            </TableCell>
                            <TableCell className="hidden xl:table-cell text-sm text-slate-500">
                              {r.issue_start_date ? format(new Date(r.issue_start_date), "MMM d, yyyy") : "—"}
                            </TableCell>
                            <TableCell className="hidden xl:table-cell text-sm text-slate-500">
                              {r.issue_end_date ? (
                                <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                                  {format(new Date(r.issue_end_date), "MMM d, yyyy")}
                                </span>
                              ) : "—"}
                            </TableCell>
                            <TableCell className="text-center">{statusBadge(r.status, isOverdue)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setViewingRequest(r); setViewOpen(true); }} title="View">
                                  <Eye className="w-4 h-4 text-slate-400" />
                                </Button>
                                {isPending && (
                                  <>
                                    <Button variant="ghost" size="sm" className="h-8 text-xs text-emerald-700 hover:bg-emerald-50 px-2" onClick={() => handleAction("issued", r)}>
                                      <CheckCircle className="w-3.5 h-3.5 mr-1" />Accept
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-8 text-xs text-red-700 hover:bg-red-50 px-2" onClick={() => handleAction("rejected", r)}>
                                      <XCircle className="w-3.5 h-3.5 mr-1" />Reject
                                    </Button>
                                  </>
                                )}
                                {isIssued && (
                                  <Button variant="ghost" size="sm" className="h-8 text-xs text-amber-700 hover:bg-amber-50 px-2" onClick={() => { setReturnRequest(r); setReturnDialogOpen(true); }}>
                                    <RotateCcw className="w-3.5 h-3.5 mr-1" />Return
                                  </Button>
                                )}
                                {(isPending || r.status === "rejected") && (
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setDeletingId(r.book_request_id); setDeleteOpen(true); }} title="Delete">
                                    <Trash2 className="w-4 h-4 text-red-400" />
                                  </Button>
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
                    const isOverdue = isOverdueCheck(r);
                    const isPending = r.status === "pending";
                    const isIssued = r.status === "issued";
                    return (
                      <div key={r.book_request_id} className={`p-4 rounded-lg border transition-colors ${isOverdue ? "border-red-200 bg-red-50/30" : isPending ? "border-amber-200 bg-amber-50/20" : "border-slate-100"}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-sm text-slate-900">{r.book?.name || "—"}</h3>
                            <p className="text-xs text-slate-500">by {r.book?.author || ""}</p>
                          </div>
                          {statusBadge(r.status, isOverdue)}
                        </div>
                        <p className="text-xs text-slate-600 mb-1">
                          <User className="w-3 h-3 inline mr-1" />
                          <strong>{r.student?.name}</strong>
                          <span className="text-slate-400 ml-1">({r.student?.student_code})</span>
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                          {r.issue_start_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />{format(new Date(r.issue_start_date), "MMM d")}
                            </span>
                          )}
                          {r.issue_end_date && (
                            <span className={`flex items-center gap-1 ${isOverdue ? "text-red-600 font-medium" : ""}`}>
                              <Clock className="w-3 h-3" />{format(new Date(r.issue_end_date), "MMM d")}
                            </span>
                          )}
                          {r.book?.category && (
                            <Badge variant="outline" className="text-[10px]">{r.book.category}</Badge>
                          )}
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

        {/* ─── View Request Dialog ────────────────────────── */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Request Details</DialogTitle></DialogHeader>
            {viewingRequest && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-violet-50 border border-violet-100">
                    <p className="text-[10px] text-slate-400 uppercase mb-1">Student</p>
                    <p className="text-sm font-semibold">{viewingRequest.student?.name || "Unknown"}</p>
                    <p className="text-xs text-slate-500">{viewingRequest.student?.student_code}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-violet-50 border border-violet-100">
                    <p className="text-[10px] text-slate-400 uppercase mb-1">Status</p>
                    {statusBadge(viewingRequest.status, isOverdueCheck(viewingRequest))}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <p className="text-[10px] text-slate-400 uppercase mb-1">Book Information</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Title</span>
                    <span className="font-medium text-right max-w-[200px] truncate">{viewingRequest.book?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Author</span>
                    <span className="font-medium">{viewingRequest.book?.author || "—"}</span>
                  </div>
                  {viewingRequest.book?.isbn && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">ISBN</span>
                      <span className="font-mono text-xs">{viewingRequest.book.isbn}</span>
                    </div>
                  )}
                  {viewingRequest.book?.category && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Category</span>
                      <Badge variant="outline" className="text-xs">{viewingRequest.book.category}</Badge>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50">
                    <p className="text-[10px] text-slate-400 uppercase mb-1">Issue Date</p>
                    <p className="text-sm font-medium">
                      {viewingRequest.issue_start_date ? format(new Date(viewingRequest.issue_start_date), "MMM d, yyyy") : "—"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50">
                    <p className="text-[10px] text-slate-400 uppercase mb-1">Due Date</p>
                    <p className={`text-sm font-medium ${isOverdueCheck(viewingRequest) ? "text-red-600" : ""}`}>
                      {viewingRequest.issue_end_date ? format(new Date(viewingRequest.issue_end_date), "MMM d, yyyy") : "—"}
                    </p>
                  </div>
                </div>
                {isOverdueCheck(viewingRequest) && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    This book is overdue! The due date has passed.
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ─── Issue Book Dialog ──────────────────────────── */}
        <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Issue New Book</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Student *</Label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Search student by name or code..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-9 mb-2"
                  />
                </div>
                <Select value={issueStudent} onValueChange={setIssueStudent}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>
                    {filteredStudents.slice(0, 100).map((s) => (
                      <SelectItem key={s.student_id} value={String(s.student_id)}>
                        {s.name} ({s.student_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Book *</Label>
                <Select value={issueBook} onValueChange={setIssueBook}>
                  <SelectTrigger><SelectValue placeholder="Select book ({availableBooks.length} available)" /></SelectTrigger>
                  <SelectContent>
                    {availableBooks.length === 0 ? (
                      <SelectItem value="_none" disabled>No books available</SelectItem>
                    ) : (
                      availableBooks.map((b) => (
                        <SelectItem key={b.book_id} value={String(b.book_id)}>
                          {b.name} by {b.author} ({b.total_copies - b.issued_copies} available)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Issue Date</Label>
                  <Input type="date" value={issueStartDate} onChange={(e) => setIssueStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={issueEndDate} onChange={(e) => setIssueEndDate(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleNewIssue} disabled={isSaving || !issueStudent || !issueBook} className="w-full bg-violet-600 hover:bg-violet-700 min-h-[44px]">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BookCheck className="w-4 h-4 mr-2" />}
                Issue Book
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ─── Return Dialog ──────────────────────────────── */}
        <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Book Return</DialogTitle></DialogHeader>
            {returnRequest && (
              <div className="space-y-4 mt-4">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Student</span>
                    <span className="font-medium">{returnRequest.student?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Book</span>
                    <span className="font-medium">{returnRequest.book?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Author</span>
                    <span className="font-medium">{returnRequest.book?.author}</span>
                  </div>
                  {returnRequest.book?.isbn && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">ISBN</span>
                      <span className="font-mono text-xs">{returnRequest.book.isbn}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Issued</span>
                    <span className="font-medium">{returnRequest.issue_start_date ? format(new Date(returnRequest.issue_start_date), "MMM d, yyyy") : "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Due</span>
                    <span className="font-medium">{returnRequest.issue_end_date ? format(new Date(returnRequest.issue_end_date), "MMM d, yyyy") : "—"}</span>
                  </div>
                </div>
                {isOverdueCheck(returnRequest) && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    This book was returned after the due date.
                  </div>
                )}
                <Button onClick={handleReturn} disabled={isSaving} className="w-full bg-violet-600 hover:bg-violet-700 min-h-[44px]">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Confirm Return
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ─── Confirm Dialog (Accept/Reject) ─────────────── */}
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
                className={confirmAction?.type === "rejected" ? "bg-red-600 hover:bg-red-700" : "bg-violet-600 hover:bg-violet-700"}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {confirmAction?.type === "issued" ? "Accept" : "Reject"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ─── Delete Dialog ──────────────────────────────── */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Request</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this book request? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
