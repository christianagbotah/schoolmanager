"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  BookCheck,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  RotateCcw,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface RequestItem {
  book_request_id: number;
  status: string;
  issue_start_date: string | null;
  issue_end_date: string | null;
  book: { book_id: number; name: string; author: string };
  student: { student_id: number; name: string; student_code: string };
}

interface StudentItem {
  student_id: number;
  student_code: string;
  name: string;
}

interface BookItem {
  book_id: number;
  name: string;
  author: string;
  total_copies: number;
  issued_copies: number;
}

// ─── Helpers ─────────────────────────────────────────────────
function statusBadge(status: string) {
  switch (status) {
    case "issued": return <Badge className="bg-blue-100 text-blue-700">Issued</Badge>;
    case "returned": return <Badge className="bg-emerald-100 text-emerald-700">Returned</Badge>;
    case "rejected": return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
    default: return <Badge variant="secondary">{status}</Badge>;
  }
}

// ─── Main Component ──────────────────────────────────────────
export default function LibrarianRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New issue dialog
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [issueStudent, setIssueStudent] = useState("");
  const [issueBook, setIssueBook] = useState("");
  const [issueEndDate, setIssueEndDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: string; text: string } | null>(null);

  // Return dialog
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnRequest, setReturnRequest] = useState<RequestItem | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/book-requests?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load requests");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
    // Fetch students and books for issue form
    fetch("/api/students?limit=200").then(r => r.ok ? r.json() : { students: [] }).then(d => setStudents(d.students || [])).catch(() => {});
    fetch("/api/books").then(r => r.ok ? r.json() : []).then(d => setBooks(Array.isArray(d) ? d : [])).catch(() => {});
  }, [fetchRequests]);

  const handleApprove = async (requestId: number) => {
    try {
      const res = await fetch("/api/book-requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book_request_id: requestId, status: "issued" }),
      });
      if (!res.ok) throw new Error("Failed");
      fetchRequests();
    } catch {
      setError("Failed to approve request");
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      const res = await fetch("/api/book-requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book_request_id: requestId, status: "rejected" }),
      });
      if (!res.ok) throw new Error("Failed");
      fetchRequests();
    } catch {
      setError("Failed to reject request");
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
      setReturnDialogOpen(false);
      setReturnRequest(null);
      fetchRequests();
    } catch {
      setError("Failed to record return");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewIssue = async () => {
    if (!issueStudent || !issueBook) return;
    setIsSaving(true);
    setSaveMsg(null);
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
      setSaveMsg({ type: "success", text: "Book issued successfully" });
      setIssueDialogOpen(false);
      setIssueStudent("");
      setIssueBook("");
      setIssueEndDate("");
      fetchRequests();
    } catch (err) {
      setSaveMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to issue book" });
    } finally {
      setIsSaving(false);
    }
  };

  const issuedCount = requests.filter(r => r.status === "issued").length;
  const overdueCount = requests.filter(r => r.status === "issued" && r.issue_end_date && new Date(r.issue_end_date) < new Date()).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Book Requests</h1>
            <p className="text-sm text-slate-500 mt-1">Approve issues, record returns, and manage book requests</p>
          </div>
          <Button onClick={() => { setSaveMsg(null); setIssueDialogOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]">
            <BookCheck className="w-4 h-4 mr-2" />Issue Book
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card className="py-3 border-l-4 border-l-blue-500"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Currently Issued</p><p className="text-lg font-bold text-blue-600">{issuedCount}</p></CardContent></Card>
          <Card className="py-3 border-l-4 border-l-red-500"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Overdue</p><p className="text-lg font-bold text-red-600">{overdueCount}</p></CardContent></Card>
          <Card className="py-3 border-l-4 border-l-emerald-500"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Total Requests</p><p className="text-lg font-bold text-emerald-600">{requests.length}</p></CardContent></Card>
        </div>

        {/* Filter */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Filter by Status</Label>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
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

        {/* Table */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12"><BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No book requests found</p></div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Book</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Issued Date</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Due Date</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((r) => {
                      const isOverdue = r.status === "issued" && r.issue_end_date && new Date(r.issue_end_date) < new Date();
                      return (
                        <TableRow key={r.book_request_id} className={`hover:bg-slate-50 ${isOverdue ? "bg-red-50/50" : ""}`}>
                          <TableCell className="font-medium text-sm">{r.student?.name || "Unknown"}</TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-slate-600 max-w-[150px] truncate">{r.book?.name || "—"}</TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-slate-500">{r.issue_start_date ? format(new Date(r.issue_start_date), "MMM d, yyyy") : "—"}</TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-slate-500">{r.issue_end_date ? format(new Date(r.issue_end_date), "MMM d, yyyy") : "—"}</TableCell>
                          <TableCell className="text-center">
                            {isOverdue ? <Badge className="bg-red-100 text-red-700">Overdue</Badge> : statusBadge(r.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {r.status === "issued" && (
                                <Button variant="ghost" size="sm" className="h-9 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50" onClick={() => { setReturnRequest(r); setReturnDialogOpen(true); }}>
                                  <RotateCcw className="w-4 h-4 mr-1" /><span className="hidden sm:inline">Return</span>
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
            )}
          </CardContent>
        </Card>

        {/* Issue Book Dialog */}
        <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Issue New Book</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              {saveMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${saveMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {saveMsg.text}
                </div>
              )}
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
      </div>
    </DashboardLayout>
  );
}
