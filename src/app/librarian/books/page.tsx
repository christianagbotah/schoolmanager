"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle, BookOpen, Plus, Loader2, Search, Save, Trash2, Pencil,
  Download, Library,
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
  sections?: { section_id: number; name: string }[];
}

// ─── Main Component ──────────────────────────────────────────
export default function LibrarianBooksPage() {
  const { toast } = useToast();
  const [books, setBooks] = useState<BookItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);
  const [deletingBook, setDeletingBook] = useState<BookItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formAuthor, setFormAuthor] = useState("");
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
      const [booksRes, classesRes] = await Promise.all([
        fetch(`/api/books${search ? `?search=${search}` : ""}`),
        fetch("/api/classes"),
      ]);
      if (booksRes.ok) {
        const data = await booksRes.json();
        setBooks(Array.isArray(data.data) ? data.data : []);
      }
      if (classesRes.ok) setClasses((await classesRes.json()) || []);
    } catch {
      setError("Failed to load books");
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openNew = () => {
    setEditingBook(null);
    setFormName(""); setFormAuthor(""); setFormDesc(""); setFormPrice(""); setFormCopies(""); setFormClass(""); setFormStatus("available");
    setDialogOpen(true);
  };

  const openEdit = (book: BookItem) => {
    setEditingBook(book);
    setFormName(book.name || "");
    setFormAuthor(book.author || "");
    setFormDesc(book.description || "");
    setFormPrice(String(book.price || ""));
    setFormCopies(String(book.total_copies || ""));
    setFormClass(book.class_id ? String(book.class_id) : "");
    setFormStatus(book.status || "available");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName) return;
    setIsSaving(true);
    try {
      const body = {
        name: formName,
        author: formAuthor,
        description: formDesc,
        price: formPrice || "0",
        total_copies: formCopies || "0",
        class_id: formClass || null,
        status: formStatus,
      };
      const res = editingBook
        ? await fetch("/api/books", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ book_id: editingBook.book_id, ...body }) })
        : await fetch("/api/books", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Success", description: editingBook ? "Book updated successfully" : "Book added successfully" });
      setDialogOpen(false);
      fetchData();
    } catch {
      toast({ title: "Error", variant: "destructive", description: "Failed to save book" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingBook) return;
    try {
      const res = await fetch(`/api/books?id=${deletingBook.book_id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Success", description: "Book deleted" });
      setDeleteOpen(false);
      setDeletingBook(null);
      fetchData();
    } catch {
      toast({ title: "Error", variant: "destructive", description: "Failed to delete book" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Books</h1>
            <p className="text-sm text-slate-500 mt-1">Manage the library book collection</p>
          </div>
          <Button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]">
            <Plus className="w-4 h-4 mr-2" />Add Book
          </Button>
        </div>

        {/* Search */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input placeholder="Search by title or author..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
          </div>
        )}

        {/* Desktop Table */}
        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Library className="w-4 h-4 text-emerald-600" />
              </div>
              <CardTitle className="text-base font-semibold">Book Collection ({books.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : books.length === 0 ? (
              <div className="text-center py-12"><BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No books found</p></div>
            ) : (
              <>
                {/* Desktop view */}
                <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200 max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase w-12">#</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase">Title</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase">Author</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden lg:table-cell">Class</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center hidden lg:table-cell">Copies</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center hidden lg:table-cell">Issued</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Available</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {books.map((book, idx) => {
                        const avail = book.total_copies - book.issued_copies;
                        return (
                          <TableRow key={book.book_id} className="hover:bg-slate-50">
                            <TableCell className="text-slate-400 text-sm">{idx + 1}</TableCell>
                            <TableCell className="font-medium text-sm text-slate-900">{book.name}</TableCell>
                            <TableCell className="text-sm text-slate-600">{book.author || "—"}</TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-slate-600">{book.school_class?.name || "—"}</TableCell>
                            <TableCell className="hidden lg:table-cell text-center text-sm tabular-nums">{book.total_copies}</TableCell>
                            <TableCell className="hidden lg:table-cell text-center text-sm tabular-nums text-blue-600">{book.issued_copies}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={avail > 0 ? "default" : "destructive"} className={`text-xs ${avail > 0 ? "bg-emerald-100 text-emerald-700" : ""}`}>
                                {avail} avail
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openEdit(book)}><Pencil className="w-4 h-4 text-slate-500" /></Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setDeletingBook(book); setDeleteOpen(true); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
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
                  {books.map((book) => {
                    const avail = book.total_copies - book.issued_copies;
                    return (
                      <div key={book.book_id} className="p-4 rounded-lg border border-slate-100 hover:bg-slate-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-sm text-slate-900 truncate">{book.name}</h3>
                            <p className="text-xs text-slate-500">{book.author || "—"}</p>
                          </div>
                          <Badge variant={avail > 0 ? "default" : "destructive"} className={`text-xs ml-2 flex-shrink-0 ${avail > 0 ? "bg-emerald-100 text-emerald-700" : ""}`}>
                            {avail} avail
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                          {book.school_class?.name && <span>Class: {book.school_class.name}</span>}
                          <span>Total: {book.total_copies}</span>
                          <span>Issued: {book.issued_copies}</span>
                          {book.price > 0 && <span>GHS {book.price}</span>}
                        </div>
                        <div className="flex gap-1 pt-2 border-t border-slate-100">
                          <Button variant="ghost" size="sm" className="h-8 text-xs flex-1" onClick={() => openEdit(book)}><Pencil className="w-3 h-3 mr-1" />Edit</Button>
                          <Button variant="ghost" size="sm" className="h-8 text-xs text-red-600 flex-1" onClick={() => { setDeletingBook(book); setDeleteOpen(true); }}><Trash2 className="w-3 h-3 mr-1" />Delete</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editingBook ? "Edit Book" : "Add New Book"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2"><Label>Title *</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Book title" /></div>
              <div className="space-y-2"><Label>Author</Label><Input value={formAuthor} onChange={(e) => setFormAuthor(e.target.value)} placeholder="Author name" /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Brief description" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Price</Label><Input type="number" min={0} step="0.01" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="0.00" /></div>
                <div className="space-y-2"><Label>Total Copies</Label><Input type="number" min={0} value={formCopies} onChange={(e) => setFormCopies(e.target.value)} placeholder="0" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={formClass} onValueChange={setFormClass}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>{classes.map(c => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formStatus} onValueChange={setFormStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="available">Available</SelectItem><SelectItem value="unavailable">Unavailable</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSave} disabled={isSaving || !formName} className="w-full bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {editingBook ? "Update Book" : "Add Book"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Book</AlertDialogTitle>
              <AlertDialogDescription>Are you sure you want to delete <strong>{deletingBook?.name}</strong>? This will also remove all associated book requests. This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete Permanently</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
