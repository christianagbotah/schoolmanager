"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BookOpen,
  Search,
  Loader2,
  AlertTriangle,
  BookCheck,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
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
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface Book {
  book_id: number;
  name: string;
  author: string;
  description: string;
  isbn: string;
  copies: number;
  available: number;
  price: number;
  status: string;
}

interface BookRequest {
  id: number;
  book_id: number;
  student_id: number;
  status: string;
  request_date: string;
  return_date: string | null;
  book: { name: string; author: string };
  student: { name: string; student_code: string };
}

// ─── Helpers ─────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "GHS", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}

// ─── Main Component ──────────────────────────────────────────
export default function TeacherLibraryPage() {
  const { isLoading: authLoading } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"browse" | "requests">("browse");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [booksRes, requestsRes] = await Promise.all([
        fetch("/api/books?limit=100"),
        fetch("/api/book-requests?limit=100"),
      ]);
      if (booksRes.ok) { const d = await booksRes.json(); setBooks(Array.isArray(d) ? d : d.books || []); }
      if (requestsRes.ok) { const d = await requestsRes.json(); setRequests(Array.isArray(d) ? d : d.requests || []); }
    } catch {
      setError("Failed to load library data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) fetchData();
  }, [authLoading, fetchData]);

  const filteredBooks = books.filter((b) => {
    const q = search.toLowerCase();
    return b.name?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q) || b.isbn?.toLowerCase().includes(q);
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Library</h1>
          <p className="text-sm text-slate-500 mt-1">Browse books and manage student requests</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
          </div>
        )}

        {/* ─── Tab Switcher ───────────────────────────────── */}
        <div className="flex gap-2">
          <Button variant={tab === "browse" ? "default" : "outline"} onClick={() => setTab("browse")} className={`min-w-[44px] min-h-[44px] ${tab === "browse" ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}>
            <BookOpen className="w-4 h-4 mr-2" />Browse Books
          </Button>
          <Button variant={tab === "requests" ? "default" : "outline"} onClick={() => setTab("requests")} className={`min-w-[44px] min-h-[44px] ${tab === "requests" ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}>
            <BookCheck className="w-4 h-4 mr-2" />Book Requests
            {requests.filter((r) => r.status === "pending").length > 0 && (
              <Badge className="ml-2 bg-red-500 text-white text-xs">{requests.filter((r) => r.status === "pending").length}</Badge>
            )}
          </Button>
        </div>

        {/* ─── Browse Books ───────────────────────────────── */}
        {tab === "browse" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search by title, author, or ISBN..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Card className="gap-4">
              <CardContent className="pt-6">
                {filteredBooks.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No books found</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase">Title</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Author</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Available</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBooks.map((book) => (
                          <TableRow key={book.book_id} className="hover:bg-slate-50">
                            <TableCell>
                              <p className="font-medium text-sm text-slate-900">{book.name}</p>
                              {book.isbn && <p className="text-xs text-slate-400 font-mono">{book.isbn}</p>}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-500">{book.author}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant={book.available > 0 ? "default" : "destructive"} className={book.available > 0 ? "bg-emerald-100 text-emerald-700" : ""}>
                                {book.available}/{book.copies}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => setSelectedBook(book)} className="min-w-[44px] min-h-[44px]">
                                View
                              </Button>
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
        )}

        {/* ─── Book Requests ───────────────────────────────── */}
        {tab === "requests" && (
          <Card className="gap-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <BookCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <CardTitle className="text-base font-semibold">Student Book Requests ({requests.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {requests.length === 0 ? (
                <div className="text-center py-12">
                  <BookCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No book requests</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Book</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Status</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((req) => (
                        <TableRow key={req.id} className="hover:bg-slate-50">
                          <TableCell className="text-sm font-medium">{req.student?.name || "—"}</TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-slate-500">{req.book?.name || "—"}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className={
                              req.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                              req.status === "returned" ? "bg-blue-100 text-blue-700" :
                              "bg-amber-100 text-amber-700"
                            }>
                              {req.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-xs text-slate-400">
                            {req.request_date ? format(new Date(req.request_date), "MMM d, yyyy") : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ─── Book Detail Dialog ──────────────────────────── */}
        <Dialog open={!!selectedBook} onOpenChange={(open) => !open && setSelectedBook(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{selectedBook?.name}</DialogTitle></DialogHeader>
            {selectedBook && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-slate-400 text-xs uppercase">Author</p><p className="font-medium">{selectedBook.author}</p></div>
                  <div><p className="text-slate-400 text-xs uppercase">ISBN</p><p className="font-mono">{selectedBook.isbn || "—"}</p></div>
                  <div><p className="text-slate-400 text-xs uppercase">Price</p><p className="font-medium">{formatCurrency(selectedBook.price)}</p></div>
                  <div><p className="text-slate-400 text-xs uppercase">Status</p>
                    <Badge variant={selectedBook.available > 0 ? "default" : "destructive"} className={selectedBook.available > 0 ? "bg-emerald-100 text-emerald-700" : ""}>
                      {selectedBook.available}/{selectedBook.copies} available
                    </Badge>
                  </div>
                </div>
                {selectedBook.description && (
                  <div><p className="text-slate-400 text-xs uppercase">Description</p><p className="text-sm text-slate-700">{selectedBook.description}</p></div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
