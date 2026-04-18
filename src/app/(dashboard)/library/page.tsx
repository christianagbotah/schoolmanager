"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BookOpen, Search, Library, Users, CheckCircle, XCircle, BookCheck, BookX,
  Plus, Loader2, BookPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { RequirePermission } from "@/components/auth/require-permission";
import { PERMISSIONS } from "@/lib/permission-constants";

// ─── Types ───────────────────────────────────────────────────
interface Book {
  book_id: number; name: string; description: string; author: string;
  class_id: number | null; price: number; total_copies: number;
  issued_copies: number; status: string;
  school_class?: { class_id: number; name: string } | null;
}

interface BookRequest {
  book_request_id: number; book_id: number; student_id: number;
  issue_start_date: string | null; issue_end_date: string | null;
  status: string;
  book: { book_id: number; name: string; author: string } | null;
  student: { student_id: number; name: string; student_code: string } | null;
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  const bg: Record<string, string> = { emerald: "bg-emerald-100 text-emerald-600", blue: "bg-blue-100 text-blue-600", amber: "bg-amber-100 text-amber-600", purple: "bg-purple-100 text-purple-600", red: "bg-red-100 text-red-600" };
  return (<Card className="border-slate-200/60"><CardContent className="p-4"><div className={`w-8 h-8 rounded-lg ${bg[color]} flex items-center justify-center mb-2`}><Icon className="w-4 h-4" /></div><p className="text-xl font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500">{label}</p></CardContent></Card>);
}

/**
 * Shared Library Page
 * - Admin/Librarian: manage books, issue/return
 * - Student: browse and request books
 */
export default function LibraryPage() {
  const { isAdmin, isLibrarian, isStudent, isLoading: authLoading, hasPermission } = useAuth();
  const { toast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [allRequests, setAllRequests] = useState<BookRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestBook, setRequestBook] = useState<Book | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const [booksRes, reqRes] = await Promise.all([
        fetch(`/api/books${search ? `?search=${search}` : ""}`),
        fetch("/api/book-requests"),
      ]);
      if (booksRes.ok) { const d = await booksRes.json(); setBooks(d.data || []); }
      if (reqRes.ok) { const d = await reqRes.json(); setAllRequests(d.data || []); }
    } catch { /* empty */ }
    setLoading(false);
  }, [search]);

  useEffect(() => { if (!authLoading) fetchBooks(); }, [authLoading, fetchBooks]);

  const totalBooks = books.reduce((s, b) => s + b.total_copies, 0);
  const issuedBooks = books.reduce((s, b) => s + b.issued_copies, 0);
  const pendingRequests = allRequests.filter((r) => r.status === "pending");
  const canManage = hasPermission(PERMISSIONS.CAN_MANAGE_BOOKS);

  const handleRequestBook = async () => {
    if (!requestBook) return;
    setIsSubmitting(true);
    try {
      // For demo, we use student_id=1. In production, use actual user id
      const res = await fetch("/api/book-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book_id: requestBook.book_id, student_id: 1, status: "pending" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      toast({ title: "Success", description: "Book request submitted" });
      setRequestDialogOpen(false);
      setRequestBook(null);
      fetchBooks();
    } catch (err) {
      toast({ title: "Error", variant: "destructive", description: err instanceof Error ? err.message : "Request failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    try {
      const res = await fetch("/api/book-requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book_request_id: requestId, status: "issued" }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Success", description: "Book issued" });
      fetchBooks();
    } catch {
      toast({ title: "Error", variant: "destructive", description: "Action failed" });
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
      toast({ title: "Success", description: "Request rejected" });
      fetchBooks();
    } catch {
      toast({ title: "Error", variant: "destructive", description: "Action failed" });
    }
  };

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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Total Books" value={totalBooks} color="emerald" />
        <StatCard icon={BookCheck} label="Available" value={totalBooks - issuedBooks} color="blue" />
        <StatCard icon={BookX} label="Issued" value={issuedBooks} color="amber" />
        <StatCard icon={Users} label="Pending Requests" value={pendingRequests.length} color={pendingRequests.length > 0 ? "red" : "purple"} />
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
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 text-sm truncate">{book.name}</h3>
                      <p className="text-xs text-slate-500">{book.author || "Unknown"}</p>
                    </div>
                  </div>
                  <Badge variant={available > 0 ? "default" : "destructive"} className={`text-xs flex-shrink-0 ${available > 0 ? "bg-emerald-100 text-emerald-700" : ""}`}>
                    {available > 0 ? `${available} avail` : "Out"}
                  </Badge>
                </div>
                {book.school_class?.name && (
                  <p className="text-[10px] text-slate-400 mb-2">Class: {book.school_class.name}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                  <span>Total: {book.total_copies}</span>
                  <span>Issued: {book.issued_copies}</span>
                  {book.price > 0 && <span>GHS {book.price}</span>}
                </div>
                {isStudent && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <Button size="sm" variant="outline" className="w-full min-h-[44px] text-emerald-600 border-emerald-200 hover:bg-emerald-50" disabled={available <= 0} onClick={() => available > 0 && (() => { setRequestBook(book); setRequestDialogOpen(true); })()}>
                      <BookPlus className="w-4 h-4 mr-2" />Request
                    </Button>
                  </div>
                )}
                {canManage && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    {available > 0 && <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600"><CheckCircle className="w-3 h-3 mr-1" /> Issue</Button>}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pending Requests (admin/librarian) */}
      {canManage && pendingRequests.length > 0 && (
        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <BookPlus className="w-4 h-4 text-blue-600" />
              </div>
              <CardTitle className="text-base font-semibold">Pending Requests ({pendingRequests.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-64 overflow-y-auto space-y-3">
              {pendingRequests.map((req) => (
                <div key={req.book_request_id} className="flex items-center justify-between p-3 rounded-lg border border-blue-100 bg-blue-50/30">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">{req.student?.name || "—"}</p>
                    <p className="text-xs text-slate-500">{req.book?.name || "—"}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleApprove(req.book_request_id)}>
                      <CheckCircle className="w-3 h-3 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleReject(req.book_request_id)}>
                      <XCircle className="w-3 h-3 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student: Request Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Book</DialogTitle></DialogHeader>
          {requestBook && (
            <div className="space-y-4 mt-4">
              <div className="p-4 rounded-lg bg-slate-50 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-slate-500">Book</span><span className="font-medium">{requestBook.name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Author</span><span className="font-medium">{requestBook.author}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Available</span><span className="font-medium text-emerald-600">{requestBook.total_copies - requestBook.issued_copies} copies</span></div>
              </div>
              <Button onClick={handleRequestBook} disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BookPlus className="w-4 h-4 mr-2" />}
                Submit Request
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
