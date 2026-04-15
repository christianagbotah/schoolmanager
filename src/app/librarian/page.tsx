"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BookCheck, BookOpen, AlertTriangle, Loader2, ArrowUpRight,
  Library as LibraryIcon, BookPlus, History, Users, Layers,
  BookX, TrendingUp, BookMarked, BarChart3, Clock, AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface BookStats {
  total_books: number;
  total_copies: number;
  issued_copies: number;
  available_copies: number;
  total_value: number;
  unique_categories: number;
  pending_requests: number;
  issued_requests: number;
  returned_requests: number;
  categories: { category: string; count: number; totalCopies: number; issuedCopies: number }[];
}

interface RequestItem {
  book_request_id: number;
  status: string;
  issue_start_date: string | null;
  issue_end_date: string | null;
  book: { book_id: number; name: string; author: string };
  student: { student_id: number; name: string; student_code: string };
}

interface PopularBook {
  book_id: number;
  name: string;
  author: string;
  total_copies: number;
  issued_copies: number;
}

interface WeeklyTrendItem {
  week: string;
  issued: number;
  returned: number;
}

// ─── Chart Config ────────────────────────────────────────────
const chartConfig = {
  issued: { label: "Issued", color: "#8b5cf6" },
  returned: { label: "Returned", color: "#10b981" },
};

const CATEGORY_COLORS = [
  "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#3b82f6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

// ─── Helpers ─────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "GHS",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Skeletons ───────────────────────────────────────────────
function StatSkeleton() {
  return (
    <Card className="gap-4 py-4">
      <CardContent className="px-4 pb-0 pt-0">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function LibrarianDashboard() {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [stats, setStats] = useState<BookStats | null>(null);
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrendItem[]>([]);
  const [popularBooks, setPopularBooks] = useState<PopularBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [booksRes, reqRes] = await Promise.all([
        fetch("/api/librarian/books?limit=1"),
        fetch("/api/librarian/requests?limit=10"),
      ]);

      if (booksRes.ok) {
        const data = await booksRes.json();
        setStats(data.stats || null);
        setWeeklyTrend(data.charts?.weeklyTrend || []);
        setPopularBooks(data.charts?.popularBooks || []);
      }
      if (reqRes.ok) {
        const data = await reqRes.json();
        setRequests(data.data || []);
      }
    } catch {
      setError("Unable to load dashboard data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const availableCopies = stats?.available_copies || 0;
  const totalCopies = stats?.total_copies || 0;
  const pendingCount = stats?.pending_requests || 0;
  const availabilityRate = totalCopies > 0 ? Math.round((availableCopies / totalCopies) * 100) : 0;
  const topCategories = (stats?.categories || []).slice(0, 8);
  const categoryChartData = topCategories.map((c, i) => ({
    name: c.category || "Uncategorized",
    count: c.count,
    fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));
  const overdueRequests = requests.filter(r => {
    if (r.status !== "issued") return false;
    if (!r.issue_end_date) return false;
    return new Date(r.issue_end_date) < new Date();
  });
  const returnedCount = stats?.returned_requests || 0;
  const issuedCount = stats?.issued_requests || 0;

  // ─── Loading State ──────────────────────────────────────
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <Skeleton className="h-72 w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Error State ────────────────────────────────────────
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">{error}</h2>
          <Button onClick={fetchData} variant="outline" className="min-h-[44px]">
            <Loader2 className="w-4 h-4 mr-2" />Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Gradient Header ────────────────────────────── */}
        <div className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <LibraryIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Library Dashboard</h1>
                <p className="text-violet-100 text-sm">Manage books, track issues, and handle requests</p>
              </div>
            </div>
            <div className="text-right text-sm space-y-1">
              <p className="text-violet-200">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
              <p className="text-white font-semibold">
                {availableCopies} of {totalCopies} copies available
              </p>
            </div>
          </div>
        </div>

        {/* ─── Primary Stat Cards (4) ─────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="gap-4 py-4 border-l-4 border-l-violet-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Books</p>
                  <p className="text-xl font-bold text-violet-600 tabular-nums">{stats?.total_books || 0}</p>
                  <p className="text-xs text-slate-400">{stats?.unique_categories || 0} categories</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-violet-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-4 py-4 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Available</p>
                  <p className="text-xl font-bold text-emerald-600 tabular-nums">{availableCopies}</p>
                  <p className="text-xs text-slate-400">{availabilityRate}% availability</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-4 py-4 border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pending</p>
                  <p className="text-xl font-bold text-amber-600 tabular-nums">{pendingCount}</p>
                  <p className="text-xs text-slate-400">awaiting approval</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-4 py-4 border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Overdue</p>
                  <p className="text-xl font-bold text-red-600 tabular-nums">{overdueRequests.length}</p>
                  <p className="text-xs text-slate-400">{issuedCount} currently issued</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <BookX className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Secondary Metrics (3) ──────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="gap-4 py-4">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Collection Value</p>
                  <p className="text-2xl font-bold text-violet-600 tabular-nums">{formatCurrency(stats?.total_value || 0)}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                  <BookMarked className="w-5 h-5 text-violet-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Returned</p>
                  <p className="text-2xl font-bold text-emerald-600 tabular-nums">{returnedCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <BookCheck className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 py-4">
            <CardContent className="px-4 pb-0 pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Total Copies</p>
                  <p className="text-2xl font-bold text-slate-700 tabular-nums">{totalCopies}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Availability Progress ──────────────────────── */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-violet-600" />
                </div>
                <CardTitle className="text-base font-semibold">Availability Overview</CardTitle>
              </div>
              <Badge
                variant="default"
                className={
                  availabilityRate >= 70
                    ? "bg-emerald-100 text-emerald-700"
                    : availabilityRate >= 40
                    ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700"
                }
              >
                {availabilityRate}% available
              </Badge>
            </div>
            <Progress
              value={Math.min(availabilityRate, 100)}
              className={`h-3 ${
                availabilityRate >= 70
                  ? "[&>div]:bg-emerald-500"
                  : availabilityRate >= 40
                  ? "[&>div]:bg-amber-500"
                  : "[&>div]:bg-red-500"
              }`}
            />
            <div className="flex justify-between mt-2 text-sm text-slate-500">
              <span>Available: {availableCopies} copies</span>
              <span>Issued: {stats?.issued_copies || 0} copies</span>
              <span>Total: {totalCopies} copies</span>
            </div>
          </CardContent>
        </Card>

        {/* ─── Weekly Issuance Chart ──────────────────────── */}
        <Card className="gap-4">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-violet-600" />
                </div>
                <CardTitle className="text-base font-semibold">Weekly Activity</CardTitle>
              </div>
              <span className="text-xs text-slate-400">Last 8 weeks</span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer config={chartConfig} className="h-[260px] w-full">
              <BarChart data={weeklyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200" />
                <XAxis
                  dataKey="week"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  allowDecimals={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="issued"
                  fill="var(--chart-issued)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="returned"
                  fill="var(--chart-returned)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* ─── Quick Actions ──────────────────────────────── */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 min-h-[88px]"
                onClick={() => router.push("/librarian/books")}
              >
                <BookOpen className="w-6 h-6" />
                <span className="text-sm font-medium">Manage Books</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 min-h-[88px]"
                onClick={() => router.push("/librarian/requests")}
              >
                <History className="w-6 h-6" />
                <span className="text-sm font-medium">Requests</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 min-h-[88px]"
                onClick={() => router.push("/librarian/requests")}
              >
                <BookPlus className="w-6 h-6" />
                <span className="text-sm font-medium">Issue Book</span>
              </Button>
              {overdueRequests.length > 0 && (
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-700 min-h-[88px]"
                  onClick={() => router.push("/librarian/requests?status=issued")}
                >
                  <AlertCircle className="w-6 h-6" />
                  <span className="text-sm font-medium">Overdue ({overdueRequests.length})</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ─── Recent Requests + Popular Books + Categories ─ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Requests */}
          <Card className="gap-4 lg:col-span-2">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                    <History className="w-4 h-4 text-violet-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">Recent Requests</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="text-violet-700" onClick={() => router.push("/librarian/requests")}>
                  View All <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Book</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Due Date</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-slate-400 py-12">
                          No recent requests
                        </TableCell>
                      </TableRow>
                    ) : (
                      requests.map((r) => {
                        const isOverdue = r.status === "issued" && r.issue_end_date && new Date(r.issue_end_date) < new Date();
                        return (
                          <TableRow key={r.book_request_id} className={`hover:bg-slate-50 ${isOverdue ? "bg-red-50/50" : ""}`}>
                            <TableCell className="font-medium text-sm">{r.student?.name || "Unknown"}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-600 max-w-[180px] truncate">
                              {r.book?.name || "—"}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-slate-500">
                              {r.issue_end_date ? format(new Date(r.issue_end_date), "MMM d, yyyy") : "—"}
                            </TableCell>
                            <TableCell className="text-center">
                              {isOverdue ? (
                                <Badge className="bg-red-100 text-red-700">Overdue</Badge>
                              ) : r.status === "pending" ? (
                                <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
                              ) : r.status === "returned" ? (
                                <Badge className="bg-emerald-100 text-emerald-700">Returned</Badge>
                              ) : r.status === "rejected" ? (
                                <Badge className="bg-red-100 text-red-700">Rejected</Badge>
                              ) : (
                                <Badge className="bg-sky-100 text-sky-700">Issued</Badge>
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

          {/* Sidebar: Popular + Categories */}
          <div className="space-y-6">
            {/* Popular Books */}
            {popularBooks.length > 0 && (
              <Card className="gap-4">
                <CardHeader className="pb-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-amber-600" />
                    </div>
                    <CardTitle className="text-base font-semibold">Most Borrowed</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {popularBooks.slice(0, 5).map((book, idx) => (
                    <div key={book.book_id} className="flex items-start gap-3 py-1.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        idx === 0 ? "bg-amber-100 text-amber-700" :
                        idx === 1 ? "bg-slate-200 text-slate-600" :
                        idx === 2 ? "bg-orange-100 text-orange-700" :
                        "bg-slate-100 text-slate-500"
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 truncate">{book.name}</p>
                        <p className="text-xs text-slate-400">{book.author} · {book.issued_copies} issued</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Categories */}
            {topCategories.length > 0 && (
              <Card className="gap-4">
                <CardHeader className="pb-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                      <Layers className="w-4 h-4 text-violet-600" />
                    </div>
                    <CardTitle className="text-base font-semibold">Categories</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {topCategories.slice(0, 6).map((cat, idx) => {
                    const pct = totalCopies > 0
                      ? Math.round((cat.totalCopies / totalCopies) * 100)
                      : 0;
                    return (
                      <div key={cat.category} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                            />
                            <span className="text-sm text-slate-600 truncate">{cat.category || "Uncategorized"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs tabular-nums">{cat.count}</Badge>
                            <span className="text-[10px] text-slate-400 tabular-nums w-8 text-right">{pct}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full transition-all"
                            style={{
                              width: `${Math.max(pct, 2)}%`,
                              backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Library Summary */}
            <Card className="gap-4">
              <CardHeader className="pb-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <BookMarked className="w-4 h-4 text-slate-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">Library Summary</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Book Titles</span>
                    <span className="font-semibold tabular-nums">{stats?.total_books || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total Copies</span>
                    <span className="font-semibold tabular-nums">{totalCopies}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Currently Issued</span>
                    <span className="font-semibold text-rose-600 tabular-nums">{stats?.issued_copies || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Available</span>
                    <span className="font-semibold text-emerald-600 tabular-nums">{availableCopies}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Pending Requests</span>
                    <span className="font-semibold text-amber-600 tabular-nums">{pendingCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Overdue</span>
                    <span className="font-semibold text-red-600 tabular-nums">{overdueRequests.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Collection Value</span>
                    <span className="font-semibold text-violet-600 tabular-nums">{formatCurrency(stats?.total_value || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
