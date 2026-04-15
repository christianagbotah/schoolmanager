"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BookOpen, Search, Library, Users, CheckCircle, XCircle, BookCheck, BookX, Plus, Pencil, Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { RequirePermission } from "@/components/auth/require-permission";
import { PERMISSIONS } from "@/lib/permissions";

// ─── Types ───────────────────────────────────────────────────
interface Book {
  book_id: number; name: string; description: string; author: string;
  class_id: number | null; price: number; total_copies: number;
  issued_copies: number; status: string;
}

interface BookRequest {
  book_request_id: number; book_id: number; student_id: number;
  issue_start_date: string | null; issue_end_date: string | null;
  status: string;
  book: { book_id: number; name: string; author: string } | null;
  student: { student_id: number; name: string; student_code: string } | null;
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  const bg: Record<string, string> = { emerald: "bg-emerald-100 text-emerald-600", blue: "bg-blue-100 text-blue-600", amber: "bg-amber-100 text-amber-600", purple: "bg-purple-100 text-purple-600" };
  return (<Card className="border-slate-200/60"><CardContent className="p-4"><div className={`w-8 h-8 rounded-lg ${bg[color]} flex items-center justify-center mb-2`}><Icon className="w-4 h-4" /></div><p className="text-xl font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500">{label}</p></CardContent></Card>);
}

/**
 * Shared Library Page
 * - Admin/Librarian: manage books, issue/return
 * - Others: browse books
 */
export default function LibraryPage() {
  const { isAdmin, isLibrarian, isStudent, isLoading: authLoading, hasPermission } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const [booksRes, reqRes] = await Promise.all([
        fetch(`/api/books?${params}`),
        fetch("/api/book-requests"),
      ]);
      if (booksRes.ok) setBooks(await booksRes.json());
      if (reqRes.ok) setRequests(await reqRes.json());
    } catch { /* empty */ }
    setLoading(false);
  }, [search]);

  useEffect(() => { if (!authLoading) fetchBooks(); }, [authLoading, fetchBooks]);

  const totalBooks = books.reduce((s, b) => s + b.total_copies, 0);
  const issuedBooks = books.reduce((s, b) => s + b.issued_copies, 0);
  const canManage = hasPermission(PERMISSIONS.CAN_MANAGE_BOOKS);

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Library</h1>
          <p className="text-sm text-slate-500 mt-1">{canManage ? "Manage books and requests" : "Browse the library catalog"}</p>
        </div>
        <RequirePermission permission={[PERMISSIONS.CAN_MANAGE_BOOKS, PERMISSIONS.CAN_ISSUE_BOOKS]} mode="any">
          <Button className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]"><Plus className="w-4 h-4 mr-2" /> Add Book</Button>
        </RequirePermission>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Total Books" value={totalBooks} color="emerald" />
        <StatCard icon={BookCheck} label="Available" value={totalBooks - issuedBooks} color="blue" />
        <StatCard icon={BookX} label="Issued" value={issuedBooks} color="amber" />
        <StatCard icon={Users} label="Requests" value={requests.filter((r) => r.status === "pending").length} color="purple" />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Search by title or author..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 min-h-[44px]" />
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {books.map((book) => {
          const available = book.total_copies - book.issued_copies;
          return (
            <Card key={book.book_id} className="hover:shadow-md transition-shadow border-slate-200/60">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0"><BookOpen className="w-4 h-4 text-emerald-600" /></div>
                    <div className="min-w-0"><h3 className="font-semibold text-slate-900 text-sm truncate">{book.name}</h3><p className="text-xs text-slate-500">{book.author || "Unknown"}</p></div>
                  </div>
                  <Badge variant={available > 0 ? "default" : "destructive"} className="text-xs flex-shrink-0">{available > 0 ? `${available} avail` : "Out"}</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                  <span>Total: {book.total_copies}</span><span>Issued: {book.issued_copies}</span>
                  {book.price > 0 && <span>GHS {book.price}</span>}
                </div>
                <RequirePermission permission={[PERMISSIONS.CAN_MANAGE_BOOKS, PERMISSIONS.CAN_ISSUE_BOOKS]} mode="any">
                  <div className="flex gap-1 mt-3 pt-3 border-t border-slate-100">
                    {available > 0 && <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600"><CheckCircle className="w-3 h-3 mr-1" /> Issue</Button>}
                    <Button size="sm" variant="ghost" className="h-7 text-xs"><Pencil className="w-3 h-3" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600"><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </RequirePermission>
                {isStudent && available > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <Button size="sm" variant="outline" className="w-full min-h-[44px] text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                      <BookCheck className="w-4 h-4 mr-2" /> Request
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pending Requests (admin/librarian) */}
      {canManage && requests.filter((r) => r.status === "pending").length > 0 && (
        <Card className="gap-4">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-64 overflow-y-auto space-y-3">
              {requests.filter((r) => r.status === "pending").map((req) => (
                <div key={req.book_request_id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{req.student?.name || "—"}</p>
                    <p className="text-xs text-slate-500">{req.book?.name || "—"}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600"><CheckCircle className="w-3 h-3 mr-1" /> Approve</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs text-red-600"><XCircle className="w-3 h-3 mr-1" /> Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
