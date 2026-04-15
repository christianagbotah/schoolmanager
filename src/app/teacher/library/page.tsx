"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BookOpen, Search, AlertTriangle, BookCheck, Eye, Users,
  Copy, CheckCircle,
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
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";

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

// ─── Helpers ─────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "GHS", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}

// ─── Main Component ──────────────────────────────────────────
export default function TeacherLibraryPage() {
  const { isLoading: authLoading } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [tab, setTab] = useState<"browse" | "info">("browse");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/teacher/library");
      if (res.ok) {
        const d = await res.json();
        setBooks(Array.isArray(d) ? d : []);
      }
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

  const totalBooks = books.length;
  const availableBooks = books.filter(b => b.available > 0).length;
  const totalCopies = books.reduce((sum, b) => sum + (b.copies || 0), 0);

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
          <p className="text-sm text-slate-500 mt-1">Browse the school library catalog</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
          </div>
        )}

        {/* ─── Stats ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card className="py-4 border-l-4 border-l-emerald-500">
            <CardContent className="px-4 pb-0 pt-0">
              <p className="text-xs font-medium text-slate-500">Total Books</p>
              <p className="text-2xl font-bold text-emerald-600">{totalBooks}</p>
            </CardContent>
          </Card>
          <Card className="py-4 border-l-4 border-l-violet-500">
            <CardContent className="px-4 pb-0 pt-0">
              <p className="text-xs font-medium text-slate-500">Available</p>
              <p className="text-2xl font-bold text-violet-600">{availableBooks}</p>
            </CardContent>
          </Card>
          <Card className="py-4 border-l-4 border-l-amber-500 col-span-2 sm:col-span-1">
            <CardContent className="px-4 pb-0 pt-0">
              <p className="text-xs font-medium text-slate-500">Total Copies</p>
              <p className="text-2xl font-bold text-amber-600">{totalCopies}</p>
            </CardContent>
          </Card>
        </div>

        {/* ─── Search ─────────────────────────────────────── */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search by title, author, or ISBN..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* ─── Books Table ──────────────────────────────── */}
        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-emerald-600" />
              </div>
              <CardTitle className="text-base font-semibold">Library Catalog ({filteredBooks.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
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
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">ISBN</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Available</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBooks.map((book) => (
                      <TableRow key={book.book_id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedBook(book)}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-14 rounded bg-emerald-50 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                              <BookOpen className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-slate-900">{book.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500">{book.author}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-slate-500 font-mono">{book.isbn || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant={book.available > 0 ? "default" : "destructive"} className={book.available > 0 ? "bg-emerald-100 text-emerald-700" : ""}>
                            {book.available}/{book.copies}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="min-w-[44px] min-h-[44px]">
                            <Eye className="w-4 h-4" />
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

        {/* ─── Book Detail Dialog ──────────────────────────── */}
        <Dialog open={!!selectedBook} onOpenChange={(open) => !open && setSelectedBook(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{selectedBook?.name}</DialogTitle></DialogHeader>
            {selectedBook && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-20 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
                    <BookOpen className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">{selectedBook.name}</p>
                    <Badge variant={selectedBook.available > 0 ? "default" : "destructive"} className={`mt-1 ${selectedBook.available > 0 ? "bg-emerald-100 text-emerald-700" : ""}`}>
                      {selectedBook.available > 0 ? `${selectedBook.available} copies available` : "Not Available"}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs uppercase">Author</p>
                    <p className="font-medium">{selectedBook.author}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase">ISBN</p>
                    <p className="font-mono">{selectedBook.isbn || "—"}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase">Price</p>
                    <p className="font-medium">{formatCurrency(selectedBook.price)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase">Total Copies</p>
                    <p className="font-medium">{selectedBook.copies}</p>
                  </div>
                </div>
                {selectedBook.description && (
                  <div>
                    <p className="text-slate-400 text-xs uppercase">Description</p>
                    <p className="text-sm text-slate-700">{selectedBook.description}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
