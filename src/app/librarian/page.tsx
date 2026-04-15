"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BookCheck, BookOpen, AlertTriangle, Clock, Loader2, ArrowUpRight,
  Library as LibraryIcon, BookPlus, History, Users, FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface BookStats {
  total_books: number;
  total_copies: number;
  issued_copies: number;
  pending_requests: number;
  issued_requests: number;
  returned_requests: number;
}

interface BookItem {
  book_id: number;
  name: string;
  author: string;
  total_copies: number;
  issued_copies: number;
  school_class?: { class_id: number; name: string } | null;
}

interface RequestItem {
  book_request_id: number;
  status: string;
  issue_start_date: string | null;
  issue_end_date: string | null;
  book: { book_id: number; name: string; author: string };
  student: { student_id: number; name: string; student_code: string };
}

// ─── Stat Skeleton ───────────────────────────────────────────
function StatSkeleton() {
  return (
    <Card className="gap-4 py-4">
      <CardContent className="px-4 pb-0 pt-0">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-16" /></div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function LibrarianDashboard() {
  const router = useRouter();
  const [books, setBooks] = useState<BookItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [stats, setStats] = useState<BookStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [booksRes, reqRes] = await Promise.all([
        fetch("/api/books"),
        fetch("/api/book-requests"),
      ]);

      if (booksRes.ok) {
        const data = await booksRes.json();
        setBooks(data.data || []);
        setStats(data.stats || null);
      }
      if (reqRes.ok) {
        const data = await reqRes.json();
        setRequests((data.data || []).slice(0, 10));
      }
    } catch {
      setError("Unable to load dashboard data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalCopies = stats?.total_copies || 0;
  const issuedCopies = stats?.issued_copies || 0;
  const availableCopies = totalCopies - issuedCopies;
  const pendingCount = stats?.pending_requests || 0;
  const overdueRequests = requests.filter(r => {
    if (r.status !== "issued") return false;
    if (!r.issue_end_date) return false;
    return new Date(r.issue_end_date) < new Date();
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}</div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80 w-full rounded-xl" />
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="w-8 h-8 text-red-600" /></div>
          <h2 className="text-xl font-semibold text-slate-900">{error}</h2>
          <Button onClick={fetchData} variant="outline"><Loader2 className="w-4 h-4 mr-2" />Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Welcome Card ─────────────────────────────────── */}
        <Card className="bg-gradient-to-r from-rose-600 to-pink-600 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <LibraryIcon className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Library Dashboard</h1>
                  <p className="text-rose-100 mt-1">Manage books, track issues, and handle requests</p>
                </div>
              </div>
              <p className="text-rose-100 text-sm">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
            </div>
          </CardContent>
        </Card>

        {/* ─── Stat Cards (matching CI3 dashboard) ─────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="gap-4 py-4 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Total Books</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats?.total_books || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><BookOpen className="w-5 h-5 text-emerald-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Pending Requests</p>
                  <p className="text-2xl font-bold text-blue-600">{pendingCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><FileText className="w-5 h-5 text-blue-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Total Copies</p>
                  <p className="text-2xl font-bold text-amber-600">{totalCopies}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><BookPlus className="w-5 h-5 text-amber-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4 border-l-4 border-l-rose-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Issued Copies</p>
                  <p className="text-2xl font-bold text-rose-600">{issuedCopies}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center"><BookCheck className="w-5 h-5 text-rose-600" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Tables ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Requests */}
          <Card className="gap-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center"><History className="w-4 h-4 text-rose-600" /></div>
                  <CardTitle className="text-base font-semibold">Recent Requests</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="text-rose-700" onClick={() => router.push("/librarian/requests")}>
                  View All <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Book</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-slate-400 py-12">No recent requests</TableCell></TableRow>
                    ) : (
                      requests.map((r) => {
                        const isOverdue = r.status === "issued" && r.issue_end_date && new Date(r.issue_end_date) < new Date();
                        return (
                          <TableRow key={r.book_request_id} className="hover:bg-slate-50">
                            <TableCell className="font-medium text-sm">{r.student?.name || "Unknown"}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-600 max-w-[150px] truncate">{r.book?.name || "—"}</TableCell>
                            <TableCell className="text-center">
                              {isOverdue ? (
                                <Badge className="bg-red-100 text-red-700">Overdue</Badge>
                              ) : r.status === "pending" ? (
                                <Badge className="bg-blue-100 text-blue-700">Pending</Badge>
                              ) : r.status === "returned" ? (
                                <Badge className="bg-emerald-100 text-emerald-700">Returned</Badge>
                              ) : r.status === "rejected" ? (
                                <Badge className="bg-red-100 text-red-700">Rejected</Badge>
                              ) : (
                                <Badge className="bg-violet-100 text-violet-700">Issued</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions & Overview */}
          <Card className="gap-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><BookCheck className="w-4 h-4 text-emerald-600" /></div>
                <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <Button variant="outline" className="w-full h-auto py-4 flex items-center gap-3 rounded-xl border-slate-200 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 transition-all justify-start" onClick={() => router.push("/librarian/books")}>
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"><BookOpen className="w-5 h-5" /></div>
                <div><p className="font-medium text-sm">Manage Books</p><p className="text-xs text-slate-500">Add, edit, or remove books</p></div>
              </Button>
              <Button variant="outline" className="w-full h-auto py-4 flex items-center gap-3 rounded-xl border-slate-200 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 transition-all justify-start" onClick={() => router.push("/librarian/requests")}>
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"><History className="w-5 h-5" /></div>
                <div><p className="font-medium text-sm">Book Requests</p><p className="text-xs text-slate-500">Approve issues and record returns</p></div>
              </Button>

              {/* Library Stats */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-sm font-semibold text-slate-700">Library Overview</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Book Titles</span><span className="font-semibold">{stats?.total_books || 0}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Total Copies</span><span className="font-semibold">{totalCopies}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Currently Issued</span><span className="font-semibold text-rose-600">{issuedCopies}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Available</span><span className="font-semibold text-emerald-600">{availableCopies}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Pending Requests</span><span className="font-semibold text-blue-600">{pendingCount}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Overdue</span><span className="font-semibold text-red-600">{overdueRequests.length}</span></div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{ width: `${totalCopies > 0 ? (availableCopies / totalCopies) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400">{totalCopies > 0 ? Math.round((availableCopies / totalCopies) * 100) : 0}% availability rate</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
