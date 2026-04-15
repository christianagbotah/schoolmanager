"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BookCheck, Search, Loader2, AlertTriangle, RotateCcw, Clock,
  BookX, CheckCircle2, AlertCircle, DollarSign, CalendarDays,
  Ban, BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface IssuedBook {
  book_request_id: number;
  book_id: number;
  student_id: number;
  issue_start_date: string | null;
  issue_end_date: string | null;
  status: string;
  daysOverdue: number;
  fine: number;
  isOverdue: boolean;
  daysIssued: number;
  book: { book_id: number; name: string; author: string; isbn: string; category: string };
  student: { student_id: number; name: string; student_code: string };
}

interface ReturnData {
  data: IssuedBook[];
  recentReturns: any[];
  stats: {
    totalIssued: number;
    totalReturned: number;
    overdueCount: number;
    totalFines: number;
    finePerDay: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "GHS", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

function StatSkeleton() {
  return <Card className="gap-4 py-4"><CardContent className="px-4 pb-0 pt-0"><div className="flex items-center justify-between"><div className="space-y-2 flex-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-20" /></div><Skeleton className="h-10 w-10 rounded-xl" /></div></CardContent></Card>;
}

// ─── Main Component ──────────────────────────────────────────
export default function ReturnsPage() {
  const [data, setData] = useState<ReturnData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [returningId, setReturningId] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<IssuedBook | null>(null);
  const [returning, setReturning] = useState(false);
  const [returnMessage, setReturnMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/librarian/returns?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      setData(await res.json());
    } catch {
      setError("Unable to load return data.");
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleReturn = async (book: IssuedBook, waiveFine: boolean = false) => {
    setReturningId(book.book_request_id);
    setReturning(true);
    setReturnMessage(null);
    try {
      const res = await fetch("/api/librarian/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book_request_id: book.book_request_id, waiveFine }),
      });
      const result = await res.json();
      if (res.ok) {
        setReturnMessage({
          type: "success",
          text: `${result.message}${result.fineInfo.daysOverdue > 0 ? ` (Fine: ${formatCurrency(result.fineInfo.fine)}${waiveFine ? ' - Waived' : ''})` : ''}`,
        });
        fetchData();
        setTimeout(() => { setConfirmDialog(null); setReturnMessage(null); }, 2000);
      } else {
        setReturnMessage({ type: "error", text: result.error });
      }
    } catch {
      setReturnMessage({ type: "error", text: "Failed to process return" });
    } finally {
      setReturningId(null);
      setReturning(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-72" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}</div>
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="w-8 h-8 text-red-600" /></div>
          <h2 className="text-xl font-semibold text-slate-900">Something went wrong</h2>
          <p className="text-slate-500">{error}</p>
          <Button onClick={fetchData} variant="outline"><Loader2 className="w-4 h-4 mr-2" />Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  const { data: issuedBooks, recentReturns, stats } = data;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Book Returns</h1>
                <p className="text-violet-100 text-sm">Process book returns and calculate overdue fines</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-red-100 text-red-700 border-0">
                <AlertCircle className="w-3 h-3 mr-1" />{stats.overdueCount} Overdue
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="gap-4 py-4 border-l-4 border-l-violet-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Currently Issued</p>
                  <p className="text-xl font-bold text-violet-600">{stats.totalIssued}</p>
                  <p className="text-xs text-slate-400">Books out</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center"><BookOpen className="w-5 h-5 text-violet-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Returned</p>
                  <p className="text-xl font-bold text-emerald-600">{stats.totalReturned}</p>
                  <p className="text-xs text-slate-400">All time</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><BookCheck className="w-5 h-5 text-emerald-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Overdue</p>
                  <p className="text-xl font-bold text-red-600">{stats.overdueCount}</p>
                  <p className="text-xs text-slate-400">Need attention</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><BookX className="w-5 h-5 text-red-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Outstanding Fines</p>
                  <p className="text-xl font-bold text-amber-600">{formatCurrency(stats.totalFines)}</p>
                  <p className="text-xs text-slate-400">{formatCurrency(stats.finePerDay)}/day</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><DollarSign className="w-5 h-5 text-amber-600" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by book title, author, student name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Issued Books Table */}
        <Card className="gap-4">
          <CardHeader className="pb-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center"><RotateCcw className="w-4 h-4 text-violet-600" /></div>
              <CardTitle className="text-base font-semibold">Issued Books ({issuedBooks.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-[600px] overflow-y-auto rounded-lg border border-slate-200">
              <Table>
                <TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase">Book</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Due Date</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden lg:table-cell">Days</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Fine</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Action</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {issuedBooks.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-slate-400 py-12">
                      <BookCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p>No issued books found</p>
                    </TableCell></TableRow>
                  ) : issuedBooks.map((book) => (
                    <TableRow key={book.book_request_id} className={`hover:bg-slate-50 ${book.isOverdue ? 'bg-red-50/50' : ''}`}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{book.student?.name || "Unknown"}</p>
                          <p className="text-xs text-slate-400">{book.student?.student_code}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{book.book?.name || "Unknown"}</p>
                          <p className="text-xs text-slate-400">{book.book?.author}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-slate-500">
                        {book.issue_end_date ? (
                          <span className={book.isOverdue ? 'text-red-600 font-medium' : ''}>
                            {format(new Date(book.issue_end_date), "MMM d, yyyy")}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm tabular-nums">
                        {book.isOverdue ? (
                          <span className="text-red-600 font-medium">{book.daysOverdue}d overdue</span>
                        ) : (
                          <span className="text-slate-500">{book.daysIssued}d issued</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {book.fine > 0 ? (
                          <span className="font-semibold text-sm tabular-nums text-red-600">{formatCurrency(book.fine)}</span>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {book.isOverdue ? (
                          <Badge className="bg-red-100 text-red-700"><AlertCircle className="w-3 h-3 mr-1" />Overdue</Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3 mr-1" />On Time</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-violet-700 hover:bg-violet-50 hover:text-violet-800 hover:border-violet-300"
                          onClick={() => setConfirmDialog(book)}
                          disabled={returningId === book.book_request_id}
                        >
                          {returningId === book.book_request_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RotateCcw className="w-4 h-4 mr-1" />
                          )}
                          Return
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Returns */}
        {recentReturns.length > 0 && (
          <Card className="gap-4">
            <CardHeader className="pb-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><BookCheck className="w-4 h-4 text-emerald-600" /></div>
                <CardTitle className="text-base font-semibold">Recent Returns</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Book</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Status</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {recentReturns.map((r: any) => (
                      <TableRow key={r.book_request_id} className="hover:bg-slate-50">
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{r.student?.name || "Unknown"}</p>
                            <p className="text-xs text-slate-400">{r.student?.student_code}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-600">{r.book?.name}</TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-emerald-100 text-emerald-700">Returned</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confirm Return Dialog */}
        <Dialog open={!!confirmDialog} onOpenChange={(open) => { if (!open) setConfirmDialog(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Book Return</DialogTitle>
            </DialogHeader>
            {confirmDialog && (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-lg bg-slate-50 border space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Student</span>
                    <span className="font-medium">{confirmDialog.student?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Book</span>
                    <span className="font-medium">{confirmDialog.book?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Due Date</span>
                    <span className={confirmDialog.isOverdue ? 'text-red-600 font-medium' : ''}>
                      {confirmDialog.issue_end_date ? format(new Date(confirmDialog.issue_end_date), "MMM d, yyyy") : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Days Issued</span>
                    <span className="font-medium">{confirmDialog.daysIssued} days</span>
                  </div>
                  {confirmDialog.isOverdue && (
                    <>
                      <div className="border-t pt-3" />
                      <div className="flex justify-between text-sm">
                        <span className="text-red-600 font-medium">Days Overdue</span>
                        <span className="text-red-600 font-bold">{confirmDialog.daysOverdue} days</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-red-600 font-medium">Fine ({formatCurrency(0.50)}/day)</span>
                        <span className="text-red-600 font-bold">{formatCurrency(confirmDialog.fine)}</span>
                      </div>
                    </>
                  )}
                </div>

                {returnMessage && (
                  <div className={`p-3 rounded-lg text-sm ${returnMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {returnMessage.text}
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              {confirmDialog?.isOverdue && (
                <Button
                  variant="outline"
                  onClick={() => handleReturn(confirmDialog, true)}
                  disabled={returning}
                  className="text-amber-700 border-amber-300 hover:bg-amber-50"
                >
                  {returning && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Ban className="w-4 h-4 mr-1" />Waive Fine
                </Button>
              )}
              <Button
                onClick={() => confirmDialog && handleReturn(confirmDialog)}
                disabled={returning}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {returning && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <RotateCcw className="w-4 h-4 mr-1" />Confirm Return
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
