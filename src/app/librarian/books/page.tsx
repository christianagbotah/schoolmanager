"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle, BookOpen, Plus, Loader2, Search, Save, Trash2, Pencil,
  Library, Layers, Hash, ScanBarcode, BookMarked, Eye, X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useToast } from "@/hooks/use-toast";

// ─── Types ───────────────────────────────────────────────────
interface BookItem {
  book_id: number;
  name: string;
  description: string;
  author: string;
  isbn: string;
  category: string;
  shelf: string;
  price: number;
  total_copies: number;
  issued_copies: number;
  status: string;
  class_id?: number | null;
  school_class?: { class_id: number; name: string } | null;
}

interface ClassItem {
  class_id: number;
  name: string;
}

const CATEGORY_OPTIONS = [
  "Fiction", "Non-Fiction", "Science", "Mathematics", "History",
  "Geography", "English", "French", "Ghanaian Language", "ICT",
  "Religious & Moral Education", "Social Studies", "Creative Arts",
  "Technical & Vocational", "Reference", "Storybooks", "Textbooks", "Other",
];

// ─── Helpers ─────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "GHS",
    minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(amount);
}

// ─── Main Component ──────────────────────────────────────────
export default function LibrarianBooksPage() {
  const { toast } = useToast();
  const [books, setBooks] = useState<BookItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Summary stats
  const [bookStats, setBookStats] = useState<{
    total_books: number;
    total_copies: number;
    issued_copies: number;
    available_copies: number;
    unique_categories: number;
  } | null>(null);

  // Form
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);
  const [viewingBook, setViewingBook] = useState<BookItem | null>(null);
  const [deletingBook, setDeletingBook] = useState<BookItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formAuthor, setFormAuthor] = useState("");
  const [formIsbn, setFormIsbn] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formShelf, setFormShelf] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCopies, setFormCopies] = useState("");
  const [formClass, setFormClass] = useState("");
  const [formStatus, setFormStatus] = useState("available");
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter !== "all") params.set("category", categoryFilter);

      const [booksRes, classesRes] = await Promise.all([
        fetch(`/api/librarian/books?${params}`),
        fetch("/api/classes"),
      ]);
      if (booksRes.ok) {
        const data = await booksRes.json();
        setBooks(Array.isArray(data.data) ? data.data : []);
        if (data.stats) {
          setBookStats({
            total_books: data.stats.total_books,
            total_copies: data.stats.total_copies,
            issued_copies: data.stats.issued_copies,
            available_copies: data.stats.available_copies,
            unique_categories: data.stats.unique_categories || 0,
          });
        }
      }
      if (classesRes.ok) setClasses((await classesRes.json()) || []);
    } catch {
      setError("Failed to load books");
    } finally {
      setIsLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openNew = () => {
    setEditingBook(null);
    setFormName(""); setFormAuthor(""); setFormIsbn(""); setFormCategory("");
    setFormShelf(""); setFormDesc(""); setFormPrice(""); setFormCopies("");
    setFormClass(""); setFormStatus("available");
    setDialogOpen(true);
  };

  const openEdit = (book: BookItem) => {
    setEditingBook(book);
    setFormName(book.name || "");
    setFormAuthor(book.author || "");
    setFormIsbn(book.isbn || "");
    setFormCategory(book.category || "");
    setFormShelf(book.shelf || "");
    setFormDesc(book.description || "");
    setFormPrice(String(book.price || ""));
    setFormCopies(String(book.total_copies || ""));
    setFormClass(book.class_id ? String(book.class_id) : "");
    setFormStatus(book.status || "available");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName) {
      toast({ title: "Error", variant: "destructive", description: "Book title is required" });
      return;
    }
    setIsSaving(true);
    try {
      const body = {
        name: formName,
        author: formAuthor,
        isbn: formIsbn,
        category: formCategory,
        shelf: formShelf,
        description: formDesc,
        price: formPrice || "0",
        total_copies: formCopies || "0",
        class_id: formClass || null,
        status: formStatus,
      };
      const res = editingBook
        ? await fetch("/api/librarian/books", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ book_id: editingBook.book_id, ...body }) })
        : await fetch("/api/librarian/books", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Failed");
      }
      toast({ title: "Success", description: editingBook ? "Book updated successfully" : "Book added successfully" });
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      toast({ title: "Error", variant: "destructive", description: err instanceof Error ? err.message : "Failed to save book" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingBook) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/librarian/books?id=${deletingBook.book_id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Failed");
      }
      toast({ title: "Success", description: "Book deleted" });
      setDeleteOpen(false);
      setDeletingBook(null);
      fetchData();
    } catch (err) {
      toast({ title: "Error", variant: "destructive", description: err instanceof Error ? err.message : "Failed to delete book" });
    } finally {
      setIsSaving(false);
    }
  };

  // Client-side status filter
  const filteredBooks = statusFilter !== "all" ? books.filter((b) => b.status === statusFilter) : books;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ─── Header ─────────────────────────────────────── */}
        <div className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Book Management</h1>
                <p className="text-violet-100 text-sm">Add, edit, and manage the library collection</p>
              </div>
            </div>
            <Button onClick={openNew} className="bg-white text-violet-700 hover:bg-violet-50 font-semibold min-h-[44px]">
              <Plus className="w-4 h-4 mr-2" />Add Book
            </Button>
          </div>
        </div>

        {/* ─── Summary Stats ──────────────────────────────── */}
        {bookStats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="py-3 border-l-4 border-l-violet-500">
              <CardContent className="px-3 pt-0 pb-0">
                <p className="text-[10px] font-medium text-slate-500 uppercase">Titles</p>
                <p className="text-lg font-bold text-violet-600 tabular-nums">{bookStats.total_books}</p>
              </CardContent>
            </Card>
            <Card className="py-3 border-l-4 border-l-emerald-500">
              <CardContent className="px-3 pt-0 pb-0">
                <p className="text-[10px] font-medium text-slate-500 uppercase">Available</p>
                <p className="text-lg font-bold text-emerald-600 tabular-nums">{bookStats.available_copies}</p>
              </CardContent>
            </Card>
            <Card className="py-3 border-l-4 border-l-amber-500">
              <CardContent className="px-3 pt-0 pb-0">
                <p className="text-[10px] font-medium text-slate-500 uppercase">Issued</p>
                <p className="text-lg font-bold text-amber-600 tabular-nums">{bookStats.issued_copies}</p>
              </CardContent>
            </Card>
            <Card className="py-3 border-l-4 border-l-sky-500">
              <CardContent className="px-3 pt-0 pb-0">
                <p className="text-[10px] font-medium text-slate-500 uppercase">Total Copies</p>
                <p className="text-lg font-bold text-sky-600 tabular-nums">{bookStats.total_copies}</p>
              </CardContent>
            </Card>
            <Card className="py-3 border-l-4 border-l-pink-500">
              <CardContent className="px-3 pt-0 pb-0">
                <p className="text-[10px] font-medium text-slate-500 uppercase">Categories</p>
                <p className="text-lg font-bold text-pink-600 tabular-nums">{bookStats.unique_categories}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── Search + Filters ───────────────────────────── */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="relative sm:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search by title, author, ISBN..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div>
                <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v)}>
                  <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORY_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
                  <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(categoryFilter !== "all" || statusFilter !== "all") && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-slate-500">Active filters:</span>
                {categoryFilter && (
                  <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => setCategoryFilter("all")}>
                    {categoryFilter} <X className="w-3 h-3 ml-1" />
                  </Badge>
                )}
                {statusFilter && (
                  <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => setStatusFilter("all")}>
                    {statusFilter} <X className="w-3 h-3 ml-1" />
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
          </div>
        )}

        {/* ─── Books Table ─────────────────────────────────── */}
        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Library className="w-4 h-4 text-violet-600" />
                </div>
                <CardTitle className="text-base font-semibold">Book Collection ({filteredBooks.length})</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : filteredBooks.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No books found</p>
                <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filters</p>
                <Button variant="outline" className="mt-4 min-h-[44px]" onClick={openNew}>
                  <Plus className="w-4 h-4 mr-2" />Add your first book
                </Button>
              </div>
            ) : (
              <>
                {/* Desktop view */}
                <div className="hidden lg:block overflow-x-auto rounded-lg border border-slate-200 max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase w-12">#</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase">Title</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase">Author</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden xl:table-cell">ISBN</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden xl:table-cell">Category</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden 2xl:table-cell">Shelf</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Copies</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Available</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden 2xl:table-cell">Price</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Status</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBooks.map((book, idx) => {
                        const avail = book.total_copies - book.issued_copies;
                        return (
                          <TableRow key={book.book_id} className="hover:bg-slate-50">
                            <TableCell className="text-slate-400 text-sm">{idx + 1}</TableCell>
                            <TableCell className="font-medium text-sm text-slate-900 max-w-[200px] truncate">{book.name}</TableCell>
                            <TableCell className="text-sm text-slate-600 max-w-[150px] truncate">{book.author || "—"}</TableCell>
                            <TableCell className="hidden xl:table-cell text-sm text-slate-500 font-mono text-xs">{book.isbn || "—"}</TableCell>
                            <TableCell className="hidden xl:table-cell">
                              {book.category ? <Badge variant="outline" className="text-xs">{book.category}</Badge> : <span className="text-xs text-slate-400">—</span>}
                            </TableCell>
                            <TableCell className="hidden 2xl:table-cell text-sm text-slate-500">{book.shelf || "—"}</TableCell>
                            <TableCell className="text-center text-sm tabular-nums">{book.total_copies}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={avail > 0 ? "default" : "destructive"} className={`text-xs ${avail > 0 ? "bg-emerald-100 text-emerald-700" : ""}`}>
                                {avail}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden 2xl:table-cell text-sm text-slate-500 tabular-nums">
                              {book.price > 0 ? formatCurrency(book.price) : "—"}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={book.status === "available" ? "default" : "secondary"} className={`text-xs ${book.status === "available" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                                {book.status === "available" ? "Available" : "Unavailable"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setViewingBook(book); setViewOpen(true); }} title="View">
                                  <Eye className="w-4 h-4 text-slate-400" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openEdit(book)} title="Edit">
                                  <Pencil className="w-4 h-4 text-slate-500" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setDeletingBook(book); setDeleteOpen(true); }} title="Delete">
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Tablet view */}
                <div className="hidden md:lg:block overflow-x-auto rounded-lg border border-slate-200 max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase w-12">#</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase">Title</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase">Author</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Copies</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Available</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBooks.map((book, idx) => {
                        const avail = book.total_copies - book.issued_copies;
                        return (
                          <TableRow key={book.book_id} className="hover:bg-slate-50">
                            <TableCell className="text-slate-400 text-sm">{idx + 1}</TableCell>
                            <TableCell>
                              <div className="min-w-0">
                                <p className="font-medium text-sm text-slate-900 truncate">{book.name}</p>
                                {book.category && <p className="text-xs text-slate-400">{book.category}</p>}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-slate-600 max-w-[120px] truncate">{book.author || "—"}</TableCell>
                            <TableCell className="text-center text-sm tabular-nums">{book.total_copies}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={avail > 0 ? "default" : "destructive"} className={`text-xs ${avail > 0 ? "bg-emerald-100 text-emerald-700" : ""}`}>{avail}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(book)}><Pencil className="w-4 h-4 text-slate-500" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setDeletingBook(book); setDeleteOpen(true); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile view */}
                <div className="md:hidden space-y-3 max-h-[500px] overflow-y-auto">
                  {filteredBooks.map((book) => {
                    const avail = book.total_copies - book.issued_copies;
                    return (
                      <div key={book.book_id} className="p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-sm text-slate-900 truncate">{book.name}</h3>
                            <p className="text-xs text-slate-500">{book.author || "—"}</p>
                          </div>
                          <Badge variant={avail > 0 ? "default" : "destructive"} className={`text-xs ml-2 flex-shrink-0 ${avail > 0 ? "bg-emerald-100 text-emerald-700" : ""}`}>
                            {avail} avail
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-3">
                          {book.isbn && <span className="font-mono">ISBN: {book.isbn}</span>}
                          {book.category && <Badge variant="outline" className="text-[10px]">{book.category}</Badge>}
                          {book.shelf && <span>Shelf: {book.shelf}</span>}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                          <span>Copies: <strong>{book.total_copies}</strong></span>
                          <span>Issued: <strong>{book.issued_copies}</strong></span>
                          {book.price > 0 && <span>{formatCurrency(book.price)}</span>}
                          <Badge variant="secondary" className={`text-[10px] ${book.status === "available" ? "bg-emerald-50 text-emerald-700" : ""}`}>
                            {book.status === "available" ? "Available" : "Unavailable"}
                          </Badge>
                        </div>
                        <div className="flex gap-1 pt-2 border-t border-slate-100">
                          <Button variant="ghost" size="sm" className="h-8 text-xs flex-1" onClick={() => { setViewingBook(book); setViewOpen(true); }}>
                            <Eye className="w-3 h-3 mr-1" />View
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 text-xs flex-1" onClick={() => openEdit(book)}>
                            <Pencil className="w-3 h-3 mr-1" />Edit
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 text-xs text-red-600 flex-1" onClick={() => { setDeletingBook(book); setDeleteOpen(true); }}>
                            <Trash2 className="w-3 h-3 mr-1" />Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ─── View Dialog ─────────────────────────────────── */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Book Details</DialogTitle></DialogHeader>
            {viewingBook && (
              <div className="space-y-4 mt-4">
                <div className="p-4 rounded-lg bg-violet-50 border border-violet-100">
                  <h3 className="text-lg font-bold text-violet-900">{viewingBook.name}</h3>
                  <p className="text-sm text-violet-600">{viewingBook.author || "Unknown Author"}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50">
                    <p className="text-[10px] text-slate-400 uppercase mb-1">ISBN</p>
                    <p className="text-sm font-mono font-medium">{viewingBook.isbn || "—"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50">
                    <p className="text-[10px] text-slate-400 uppercase mb-1">Category</p>
                    <p className="text-sm font-medium">{viewingBook.category || "—"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50">
                    <p className="text-[10px] text-slate-400 uppercase mb-1">Shelf</p>
                    <p className="text-sm font-medium">{viewingBook.shelf || "—"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50">
                    <p className="text-[10px] text-slate-400 uppercase mb-1">Class</p>
                    <p className="text-sm font-medium">{viewingBook.school_class?.name || "—"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50">
                    <p className="text-[10px] text-slate-400 uppercase mb-1">Price</p>
                    <p className="text-sm font-medium">{viewingBook.price > 0 ? formatCurrency(viewingBook.price) : "—"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50">
                    <p className="text-[10px] text-slate-400 uppercase mb-1">Status</p>
                    <Badge variant={viewingBook.status === "available" ? "default" : "secondary"} className={`text-xs ${viewingBook.status === "available" ? "bg-emerald-100 text-emerald-700" : ""}`}>
                      {viewingBook.status === "available" ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-[10px] text-slate-400 uppercase mb-2">Copies Overview</p>
                  <div className="flex items-center justify-around text-center">
                    <div>
                      <p className="text-2xl font-bold text-slate-900 tabular-nums">{viewingBook.total_copies}</p>
                      <p className="text-xs text-slate-500">Total</p>
                    </div>
                    <div className="w-px h-10 bg-slate-200" />
                    <div>
                      <p className="text-2xl font-bold text-amber-600 tabular-nums">{viewingBook.issued_copies}</p>
                      <p className="text-xs text-slate-500">Issued</p>
                    </div>
                    <div className="w-px h-10 bg-slate-200" />
                    <div>
                      <p className="text-2xl font-bold text-emerald-600 tabular-nums">{viewingBook.total_copies - viewingBook.issued_copies}</p>
                      <p className="text-xs text-slate-500">Available</p>
                    </div>
                  </div>
                </div>
                {viewingBook.description && (
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase mb-1">Description</p>
                    <p className="text-sm text-slate-600">{viewingBook.description}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ─── Add/Edit Dialog ────────────────────────────── */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBook ? "Edit Book" : "Add New Book"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Book title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Author</Label>
                  <div className="relative">
                    <Pencil className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input value={formAuthor} onChange={(e) => setFormAuthor(e.target.value)} placeholder="Author name" className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>ISBN</Label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input value={formIsbn} onChange={(e) => setFormIsbn(e.target.value)} placeholder="e.g., 978-0-13-110826-8" className="pl-9 font-mono text-sm" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Shelf Location</Label>
                  <div className="relative">
                    <ScanBarcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input value={formShelf} onChange={(e) => setFormShelf(e.target.value)} placeholder="e.g., A-12" className="pl-9" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Brief description (optional)" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (GHS)</Label>
                  <Input type="number" min={0} step="0.01" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Total Copies</Label>
                  <Input type="number" min={0} value={formCopies} onChange={(e) => setFormCopies(e.target.value)} placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class (optional)</Label>
                  <Select value={formClass} onValueChange={setFormClass}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>{classes.map((c) => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formStatus} onValueChange={setFormStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="unavailable">Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSave} disabled={isSaving || !formName} className="w-full bg-violet-600 hover:bg-violet-700 min-h-[44px]">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {editingBook ? "Update Book" : "Add Book"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ─── Delete Dialog ──────────────────────────────── */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Book</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{deletingBook?.name}</strong>? This will also remove all associated book requests. This action cannot be undone.
                {deletingBook && deletingBook.issued_copies > 0 && (
                  <span className="text-red-600 font-medium block mt-2">Warning: {deletingBook.issued_copies} copies are currently issued.</span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Delete Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
