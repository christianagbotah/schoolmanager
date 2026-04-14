"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  BookOpen,
  Plus,
  Loader2,
  Search,
  Save,
  Trash2,
  Pencil,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
}

interface ClassItem {
  class_id: number;
  name: string;
}

// ─── Main Component ──────────────────────────────────────────
export default function LibrarianBooksPage() {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formAuthor, setFormAuthor] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCopies, setFormCopies] = useState("");
  const [formClass, setFormClass] = useState("");
  const [formStatus, setFormStatus] = useState("available");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: string; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [booksRes, classesRes] = await Promise.all([
        fetch(`/api/books${search ? `?search=${search}` : ""}`),
        fetch("/api/classes"),
      ]);
      if (booksRes.ok) {
        const booksData = await booksRes.json();
        setBooks(Array.isArray(booksData) ? booksData : []);
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
    setSaveMsg(null);
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
    setSaveMsg(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName) return;
    setIsSaving(true);
    setSaveMsg(null);
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
      setSaveMsg({ type: "success", text: editingBook ? "Book updated successfully" : "Book added successfully" });
      setDialogOpen(false);
      fetchData();
    } catch {
      setSaveMsg({ type: "error", text: "Failed to save book" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (bookId: number) => {
    if (!confirm("Are you sure you want to delete this book?")) return;
    try {
      const res = await fetch(`/api/books?id=${bookId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      fetchData();
    } catch {
      setError("Failed to delete book");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
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
            <div className="space-y-2">
              <Label>Search Books</Label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input placeholder="Search by title or author..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
          </div>
        )}

        {/* Table */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : books.length === 0 ? (
              <div className="text-center py-12"><BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No books found</p></div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Title</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Author</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center hidden md:table-cell">Copies</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center hidden md:table-cell">Issued</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {books.map((book) => (
                      <TableRow key={book.book_id} className="hover:bg-slate-50">
                        <TableCell className="font-medium text-sm">{book.name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-600">{book.author || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell text-center text-sm tabular-nums">{book.total_copies}</TableCell>
                        <TableCell className="hidden md:table-cell text-center text-sm tabular-nums text-blue-600">{book.issued_copies}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={book.status === "available" ? "default" : "secondary"}>
                            {book.status === "available" ? "Available" : book.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openEdit(book)}>
                              <Pencil className="w-4 h-4 text-slate-500" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleDelete(book.book_id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editingBook ? "Edit Book" : "Add New Book"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              {saveMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${saveMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {saveMsg.text}
                </div>
              )}
              <div className="space-y-2"><Label>Title *</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Book title" /></div>
              <div className="space-y-2"><Label>Author</Label><Input value={formAuthor} onChange={(e) => setFormAuthor(e.target.value)} placeholder="Author name" /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Brief description" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Price</Label><Input type="number" min={0} value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="0.00" /></div>
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
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="unavailable">Unavailable</SelectItem>
                    </SelectContent>
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
      </div>
    </DashboardLayout>
  );
}
