"use client";

import { useEffect, useState, useCallback } from "react";
import { BookOpen, Search, Loader2, AlertTriangle, BookCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

interface BookRequest { id: number; book_id: number; student_id: number; status: string; request_date: string; return_date: string | null; book: { name: string; author: string }; student: { name: string; student_code: string }; }
interface Book { book_id: number; name: string; author: string; available: number; copies: number; }

export default function ParentLibraryPage() {
  const { isLoading: authLoading } = useAuth();
  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"books" | "requests">("books");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [reqRes, bookRes] = await Promise.all([fetch("/api/book-requests?limit=100"), fetch("/api/books?limit=100")]);
      if (reqRes.ok) { const d = await reqRes.json(); setRequests(Array.isArray(d) ? d : d.requests || []); }
      if (bookRes.ok) { const d = await bookRes.json(); setBooks(Array.isArray(d) ? d : d.books || []); }
    } catch { /* silent */ } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { if (!authLoading) fetchData(); }, [authLoading, fetchData]);

  const filteredBooks = books.filter((b) => { const q = search.toLowerCase(); return b.name?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q); });

  if (isLoading) return <DashboardLayout><div className="space-y-6"><Skeleton className="h-8 w-48" /><div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Library</h1><p className="text-sm text-slate-500 mt-1">Browse available books and children&apos;s requests</p></div>
        <div className="flex gap-2">
          <Button variant={tab === "books" ? "default" : "outline"} onClick={() => setTab("books")} className={`min-w-[44px] min-h-[44px] ${tab === "books" ? "bg-purple-600 hover:bg-purple-700" : ""}`}><BookOpen className="w-4 h-4 mr-2" />Available Books</Button>
          <Button variant={tab === "requests" ? "default" : "outline"} onClick={() => setTab("requests")} className={`min-w-[44px] min-h-[44px] ${tab === "requests" ? "bg-purple-600 hover:bg-purple-700" : ""}`}><BookCheck className="w-4 h-4 mr-2" />Book Requests ({requests.length})</Button>
        </div>

        {tab === "books" && (
          <div className="space-y-4">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search books..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
            <Card className="gap-4"><CardContent className="pt-6">
              {filteredBooks.length === 0 ? <div className="text-center py-12"><BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No books found</p></div> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {filteredBooks.map((b) => (
                    <div key={b.book_id} className="p-4 rounded-lg border border-slate-100 hover:shadow-md transition-shadow">
                      <h4 className="font-semibold text-sm text-slate-900 truncate">{b.name}</h4>
                      <p className="text-xs text-slate-500">{b.author}</p>
                      <Badge variant={b.available > 0 ? "default" : "destructive"} className={`mt-2 text-xs ${b.available > 0 ? "bg-emerald-100 text-emerald-700" : ""}`}>{b.available}/{b.copies} available</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent></Card>
          </div>
        )}

        {tab === "requests" && (
          <Card className="gap-4"><CardHeader><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center"><BookCheck className="w-4 h-4 text-purple-600" /></div><CardTitle className="text-base font-semibold">Book Requests ({requests.length})</CardTitle></div></CardHeader>
            <CardContent className="pt-0">
              {requests.length === 0 ? <div className="text-center py-12"><BookCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No requests found</p></div> : (
                <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
                  <Table><TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Book</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Date</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>{requests.map((r) => (
                    <TableRow key={r.id} className="hover:bg-slate-50">
                      <TableCell className="text-sm font-medium">{r.student?.name || "—"}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-slate-500">{r.book?.name || "—"}</TableCell>
                      <TableCell className="text-center"><Badge variant="secondary" className={r.status === "approved" ? "bg-emerald-100 text-emerald-700" : r.status === "returned" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}>{r.status}</Badge></TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-slate-400">{r.request_date ? format(new Date(r.request_date), "MMM d, yyyy") : "—"}</TableCell>
                    </TableRow>
                  ))}</TableBody></Table>
                </div>
              )}
            </CardContent></Card>
        )}
      </div>
    </DashboardLayout>
  );
}
