"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BookOpen, Search, Loader2, AlertTriangle, BookCheck, Library as LibraryIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

interface BookItem { book_id: number; name: string; description: string; author: string; class_id: number | null; price: number; total_copies: number; issued_copies: number; status: string; available: number; copies: number; }
interface BookRequestItem { book_request_id: number; book_id: number; student_id: number; issue_start_date: string | null; issue_end_date: string | null; status: string; book: { name: string; author: string } | null; student: { name: string; student_code: string } | null; }
interface ChildItem { student_id: number; name: string; student_code: string; }

export default function ParentLibraryPage() {
  const { isLoading: authLoading, isParent } = useAuth();
  const [books, setBooks] = useState<BookItem[]>([]);
  const [requests, setRequests] = useState<BookRequestItem[]>([]);
  const [children, setChildren] = useState<ChildItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"books" | "requests">("books");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/parent/library");
      if (res.ok) { const d = await res.json(); setBooks(d.books || []); setRequests(d.requests || []); setChildren(d.children || []); }
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { if (!authLoading && isParent) fetchData(); }, [authLoading, isParent, fetchData]);

  const filteredBooks = books.filter((b) => { const q = search.toLowerCase(); return b.name?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q); });

  if (isLoading) return <DashboardLayout><div className="space-y-6"><Skeleton className="h-8 w-48" /><div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Library</h1><p className="text-sm text-slate-500 mt-1">Browse available books and your children&apos;s borrowing requests</p></div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "books" | "requests")}>
          <TabsList>
            <TabsTrigger value="books" className="gap-1.5"><BookOpen className="w-4 h-4" />Available Books ({books.length})</TabsTrigger>
            <TabsTrigger value="requests" className="gap-1.5"><BookCheck className="w-4 h-4" />My Requests ({requests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="books" className="mt-4">
            <div className="space-y-4">
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search books by name or author..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
              <Card className="gap-4">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center"><LibraryIcon className="w-4 h-4 text-teal-600" /></div>
                    <CardTitle className="text-base font-semibold">Books ({filteredBooks.length})</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {filteredBooks.length === 0 ? (
                    <div className="text-center py-12"><BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No books found</p></div>
                  ) : (
                    <div className="max-h-[500px] overflow-y-auto rounded-lg border border-slate-200">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="text-xs font-semibold text-slate-600 uppercase">#</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 uppercase">Title</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Author</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Price</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Copies</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredBooks.map((b, idx) => (
                            <TableRow key={b.book_id} className="hover:bg-slate-50">
                              <TableCell className="text-slate-400 text-sm">{idx + 1}</TableCell>
                              <TableCell><p className="font-medium text-sm">{b.name}</p>{b.description && <p className="text-[10px] text-slate-400 line-clamp-1">{b.description}</p>}</TableCell>
                              <TableCell className="hidden sm:table-cell text-sm text-slate-600">{b.author}</TableCell>
                              <TableCell className="hidden sm:table-cell text-sm text-slate-500">{b.price > 0 ? `GHS ${b.price.toFixed(2)}` : "—"}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant={b.available > 0 ? "default" : "destructive"} className={`text-xs ${b.available > 0 ? "bg-emerald-100 text-emerald-700" : ""}`}>
                                  {b.available}/{b.copies} available
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="requests" className="mt-4">
            <Card className="gap-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center"><BookCheck className="w-4 h-4 text-violet-600" /></div>
                  <CardTitle className="text-base font-semibold">Book Requests ({requests.length})</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {requests.length === 0 ? (
                  <div className="text-center py-12"><BookCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No book requests found</p></div>
                ) : (
                  <div className="max-h-[500px] overflow-y-auto rounded-lg border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Book</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Author</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Status</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requests.map((r) => (
                          <TableRow key={r.book_request_id} className="hover:bg-slate-50">
                            <TableCell className="text-sm font-medium">{r.student?.name || "—"}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-600">{r.book?.name || "—"}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-500">{r.book?.author || "—"}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className={
                                r.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                                r.status === "returned" ? "bg-sky-100 text-sky-700" :
                                r.status === "rejected" ? "bg-red-100 text-red-700" :
                                "bg-amber-100 text-amber-700"
                              }>{r.status || "Pending"}</Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-xs text-slate-400">{r.issue_start_date ? format(new Date(r.issue_start_date), "MMM d, yyyy") : "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
