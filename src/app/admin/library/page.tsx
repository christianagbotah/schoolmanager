'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  BookOpen, Plus, Search, Pencil, Trash2, CheckCircle,
  BookCheck, Loader2, AlertTriangle, Library,
  Calendar, ArrowRightLeft, User
} from 'lucide-react';
import { format } from 'date-fns';

interface Book {
  book_id: number; name: string; description: string; author: string;
  class_id: number | null; price: number; total_copies: number;
  issued_copies: number; status: string; isbn: string; category: string;
  shelf: string; available_copies?: number; active_requests?: number;
}

interface BookRequest {
  book_request_id: number; book_id: number; student_id: number;
  issue_start_date: string | null; issue_end_date: string | null; status: string;
  book: { book_id: number; name: string; author: string } | null;
  student: { student_id: number; name: string; student_code: string } | null;
}

interface Student { student_id: number; name: string; student_code: string; }

const BOOK_COLORS = [
  { bg: 'from-emerald-400 to-emerald-600', light: 'bg-emerald-100' },
  { bg: 'from-sky-400 to-sky-600', light: 'bg-sky-100' },
  { bg: 'from-amber-400 to-amber-600', light: 'bg-amber-100' },
  { bg: 'from-violet-400 to-violet-600', light: 'bg-violet-100' },
  { bg: 'from-rose-400 to-rose-600', light: 'bg-rose-100' },
  { bg: 'from-teal-400 to-teal-600', light: 'bg-teal-100' },
  { bg: 'from-orange-400 to-orange-600', light: 'bg-orange-100' },
  { bg: 'from-cyan-400 to-cyan-600', light: 'bg-cyan-100' },
];

function getBookColor(id: number) {
  return BOOK_COLORS[id % BOOK_COLORS.length];
}

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-11 w-28 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-slate-200/60">
            <CardContent className="p-4 flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-14" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border-slate-200/60">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="w-14 h-[76px] rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                </div>
              </div>
              <Skeleton className="h-1.5 w-full rounded-full mt-3" />
              <div className="flex gap-2 mt-4">
                <Skeleton className="h-8 w-16 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md ml-auto" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  const [bookFormOpen, setBookFormOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [activeTab, setActiveTab] = useState('books');
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [bookForm, setBookForm] = useState({
    name: '', description: '', author: '', class_id: '', price: '',
    total_copies: '1', status: 'available', isbn: '', category: '', shelf: '',
  });
  const [issueForm, setIssueForm] = useState({ student_id: '', book_id: '', issue_end_date: '' });

  const filteredBooks = useMemo(() => {
    if (!search.trim()) return books;
    const q = search.toLowerCase();
    return books.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.isbn.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q)
    );
  }, [books, search]);

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase();
    return students.filter(s =>
      s.name.toLowerCase().includes(q) || s.student_code.toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const [booksRes, reqRes, stRes] = await Promise.all([
        fetch('/api/admin/books'),
        fetch('/api/admin/book-requests'),
        fetch('/api/admin/students'),
      ]);
      const booksData = await booksRes.json();
      setBooks(Array.isArray(booksData) ? booksData : []);
      const reqData = await reqRes.json();
      setRequests(Array.isArray(reqData) ? reqData : []);
      const stData = await stRes.json();
      setStudents(Array.isArray(stData) ? stData.slice(0, 200) : []);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const validateBookForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!bookForm.name.trim()) errors.name = 'Book title is required';
    if (bookForm.price && isNaN(Number(bookForm.price))) errors.price = 'Price must be a number';
    if (bookForm.total_copies && (isNaN(Number(bookForm.total_copies)) || Number(bookForm.total_copies) < 0)) {
      errors.total_copies = 'Copies must be a positive number';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateBook = () => {
    setSelectedBook(null);
    setBookForm({ name: '', description: '', author: '', class_id: '', price: '', total_copies: '1', status: 'available', isbn: '', category: '', shelf: '' });
    setFormErrors({});
    setBookFormOpen(true);
  };

  const openEditBook = (b: Book) => {
    setSelectedBook(b);
    setBookForm({
      name: b.name, description: b.description, author: b.author,
      class_id: b.class_id?.toString() || '', price: b.price.toString(),
      total_copies: b.total_copies.toString(), status: b.status,
      isbn: b.isbn || '', category: b.category || '', shelf: b.shelf || '',
    });
    setFormErrors({});
    setBookFormOpen(true);
  };

  const handleSaveBook = async () => {
    if (!validateBookForm()) return;
    setSaving(true);
    try {
      const url = selectedBook ? `/api/admin/books?id=${selectedBook.book_id}` : '/api/admin/books';
      const method = selectedBook ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bookForm,
          price: bookForm.price ? Number(bookForm.price) : 0,
          total_copies: Number(bookForm.total_copies) || 1,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(selectedBook ? 'Book updated successfully' : 'Book created successfully');
      setBookFormOpen(false);
      fetchBooks();
    } catch { toast.error('Failed to save book'); }
    setSaving(false);
  };

  const handleDeleteBook = async () => {
    if (!selectedBook) return;
    try {
      const res = await fetch(`/api/admin/books?id=${selectedBook.book_id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success('Book deleted');
      setDeleteOpen(false);
      fetchBooks();
    } catch { toast.error('Failed to delete'); }
  };

  const openIssue = (book: Book) => {
    setSelectedBook(book);
    setIssueForm({ student_id: '', book_id: book.book_id.toString(), issue_end_date: '' });
    setStudentSearch('');
    setIssueOpen(true);
  };

  const handleIssue = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/book-requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...issueForm, status: 'issued' }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      toast.success('Book issued successfully');
      setIssueOpen(false);
      fetchBooks();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to issue book';
      toast.error(msg);
    }
    setSaving(false);
  };

  const handleReturn = async (req: BookRequest) => {
    try {
      await fetch('/api/admin/book-requests', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_request_id: req.book_request_id, status: 'returned' }),
      });
      toast.success('Book returned successfully');
      fetchBooks();
    } catch { toast.error('Failed to return'); }
  };

  const totalBooks = books.reduce((s, b) => s + b.total_copies, 0);
  const issuedBooks = books.reduce((s, b) => s + b.issued_copies, 0);
  const availableBooks = totalBooks - issuedBooks;
  const uniqueTitles = books.length;
  const overdueRequests = requests.filter(r => r.status === 'issued' && r.issue_end_date && new Date(r.issue_end_date) < new Date());

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Library Management</h1>
            <p className="text-sm text-slate-500 mt-1">Books catalog, issues and returns</p>
          </div>
          <Button onClick={openCreateBook} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Add Book
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading ? (
            <>
              <PageSkeleton />
            </>
          ) : (
            <>
              <Card className="border-slate-200/60 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Library className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">Total Titles</p>
                    <p className="text-xl font-bold text-slate-900">{uniqueTitles}</p>
                    <p className="text-[10px] text-slate-400">{totalBooks} copies</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200/60 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                    <BookCheck className="w-5 h-5 text-sky-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">Available</p>
                    <p className="text-xl font-bold text-slate-900">{availableBooks}</p>
                    <p className="text-[10px] text-emerald-500 font-medium">
                      {totalBooks > 0 ? Math.round((availableBooks / totalBooks) * 100) : 0}% available
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200/60 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <ArrowRightLeft className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">Issued</p>
                    <p className="text-xl font-bold text-slate-900">{issuedBooks}</p>
                    <p className="text-[10px] text-slate-400">Currently out</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200/60 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">Overdue</p>
                    <p className="text-xl font-bold text-slate-900">{overdueRequests.length}</p>
                    <p className="text-[10px] text-rose-500 font-medium">
                      {overdueRequests.length > 0 ? 'Need attention' : 'All on time'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Show tabs only when not loading */}
      {!loading && (
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 bg-white border border-slate-200 p-1 rounded-xl h-auto flex w-full sm:w-auto">
            <TabsTrigger value="books" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <BookOpen className="w-4 h-4 mr-1.5 hidden sm:inline" /> Books ({books.length})
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <BookCheck className="w-4 h-4 mr-1.5 hidden sm:inline" /> Issues & Returns
            </TabsTrigger>
          </TabsList>

          {/* Books Tab */}
          <TabsContent value="books">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by title, author, ISBN, or category..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10 min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>
            </div>

            {filteredBooks.length === 0 ? (
              <Card className="py-16 border-slate-200/60">
                <CardContent className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-slate-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 font-medium">No books found</p>
                    <p className="text-sm text-slate-400 mt-1">
                      {search ? 'Try a different search term' : 'Add your first book to the library'}
                    </p>
                  </div>
                  {!search && (
                    <Button onClick={openCreateBook} variant="outline" className="mt-2 min-h-[44px]">
                      <Plus className="w-4 h-4 mr-2" /> Add Book
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBooks.map(book => {
                    const available = book.total_copies - book.issued_copies;
                    const color = getBookColor(book.book_id);
                    const availabilityPct = book.total_copies > 0 ? (available / book.total_copies) * 100 : 0;
                    return (
                      <Card key={book.book_id} className="hover:shadow-md transition-shadow border-slate-200/60 group">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {/* Book cover placeholder */}
                            <div className={`w-14 h-[76px] rounded-lg bg-gradient-to-br ${color.bg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                              <BookOpen className="w-6 h-6 text-white/90" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-slate-900 text-sm truncate">{book.name}</h3>
                              <p className="text-xs text-slate-500 mt-0.5 truncate">{book.author || 'Unknown Author'}</p>

                              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                {/* Availability indicator */}
                                <Badge
                                  variant="secondary"
                                  className={`text-[10px] h-5 px-1.5 font-medium ${
                                    available > 0
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-red-50 text-red-700 border border-red-200'
                                  }`}
                                >
                                  {available > 0 ? `${available} available` : 'None available'}
                                </Badge>
                                {book.category && (
                                  <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-full">
                                    {book.category}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Availability bar */}
                          <div className="mt-3 space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                              <span>{available} of {book.total_copies} copies available</span>
                              {book.price > 0 && <span className="font-medium text-slate-700">GHS {book.price}</span>}
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  availabilityPct > 50 ? 'bg-emerald-500' : availabilityPct > 0 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${availabilityPct}%` }}
                              />
                            </div>
                          </div>

                          {book.isbn && (
                            <p className="text-[10px] text-slate-400 mt-1 font-mono">ISBN: {book.isbn}</p>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100">
                            {available > 0 && (
                              <Button size="sm" variant="ghost" className="h-8 text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 min-h-[36px]" onClick={() => openIssue(book)}>
                                <ArrowRightLeft className="w-3.5 h-3.5 mr-1" /> Issue
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-8 text-xs text-slate-500 hover:bg-slate-50 min-h-[36px]" onClick={() => openEditBook(book)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm" variant="ghost"
                              className="h-8 text-xs text-red-500 hover:bg-red-50 hover:text-red-600 min-h-[36px] ml-auto"
                              onClick={() => { setSelectedBook(book); setDeleteOpen(true); }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                {search && (
                  <p className="text-xs text-slate-400 text-center mt-2">
                    Showing {filteredBooks.length} of {books.length} books
                  </p>
                )}
              </>
            )}
          </TabsContent>

          {/* Issues & Returns Tab */}
          <TabsContent value="requests">
            {/* Desktop table */}
            <Card className="border-slate-200/60 hidden md:block">
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-xs font-semibold text-slate-600">Student</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Book</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Issued</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Due</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 w-24"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-slate-400 py-12">
                            <div className="flex flex-col items-center gap-2">
                              <ArrowRightLeft className="w-8 h-8 text-slate-300" />
                              <p className="text-sm font-medium">No book requests</p>
                              <p className="text-xs text-slate-400">Issued books will appear here</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : requests.map(req => {
                        const isOverdue = req.status === 'issued' && req.issue_end_date && new Date(req.issue_end_date) < new Date();
                        return (
                          <TableRow key={req.book_request_id} className={isOverdue ? 'bg-red-50/50' : ''}>
                            <TableCell className="text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                  <User className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">{req.student?.name || '\u2014'}</p>
                                  <p className="text-[10px] text-slate-400">{req.student?.student_code}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              <p className="font-medium text-slate-900">{req.book?.name || '\u2014'}</p>
                              <p className="text-[10px] text-slate-400">{req.book?.author}</p>
                            </TableCell>
                            <TableCell className="text-xs text-slate-500">
                              {req.issue_start_date ? format(new Date(req.issue_start_date), 'MMM d, yyyy') : '\u2014'}
                            </TableCell>
                            <TableCell className="text-xs">
                              <span className={isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'}>
                                {req.issue_end_date ? format(new Date(req.issue_end_date), 'MMM d, yyyy') : '\u2014'}
                              </span>
                              {isOverdue && <span className="text-[10px] text-red-500 block">Overdue</span>}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={req.status === 'issued' ? 'default' : 'secondary'}
                                className={`text-xs ${
                                  isOverdue ? 'bg-red-100 text-red-700 hover:bg-red-100' :
                                  req.status === 'issued' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' :
                                  'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                }`}
                              >
                                {isOverdue ? 'Overdue' : req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {req.status === 'issued' && (
                                <Button size="sm" variant="outline" className="h-8 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 min-h-[36px]" onClick={() => handleReturn(req)}>
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Return
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Mobile card view */}
            <div className="md:hidden space-y-3">
              {requests.length === 0 ? (
                <Card className="border-slate-200/60">
                  <CardContent className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <ArrowRightLeft className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-medium">No book requests</p>
                    </div>
                  </CardContent>
                </Card>
              ) : requests.map(req => {
                const isOverdue = req.status === 'issued' && req.issue_end_date && new Date(req.issue_end_date) < new Date();
                return (
                  <Card key={req.book_request_id} className={`border-slate-200/60 ${isOverdue ? 'border-red-200 bg-red-50/30' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{req.student?.name || '\u2014'}</p>
                            <p className="text-[10px] text-slate-400">{req.student?.student_code}</p>
                          </div>
                        </div>
                        <Badge
                          variant={req.status === 'issued' ? 'default' : 'secondary'}
                          className={`text-[10px] flex-shrink-0 ${
                            isOverdue ? 'bg-red-100 text-red-700' :
                            req.status === 'issued' ? 'bg-amber-100 text-amber-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isOverdue ? 'Overdue' : req.status}
                        </Badge>
                      </div>
                      <div className="flex items-start gap-2 mb-2">
                        <BookOpen className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{req.book?.name || '\u2014'}</p>
                          <p className="text-[10px] text-slate-400">{req.book?.author}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-slate-500 mb-3">
                        {req.issue_start_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Issued: {format(new Date(req.issue_start_date), 'MMM d')}
                          </span>
                        )}
                        {req.issue_end_date && (
                          <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                            <Calendar className="w-3 h-3" />
                            Due: {format(new Date(req.issue_end_date), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                      {req.status === 'issued' && (
                        <Button
                          size="sm"
                          className="w-full h-10 text-xs bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
                          onClick={() => handleReturn(req)}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Mark as Returned
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {requests.length > 0 && (
              <p className="text-xs text-slate-400 text-center mt-3">
                Showing {requests.length} issue(s)
                {overdueRequests.length > 0 && (
                  <span className="text-red-500 ml-1">&middot; {overdueRequests.length} overdue</span>
                )}
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
      )}

      {/* Add/Edit Book Dialog */}
      <Dialog open={bookFormOpen} onOpenChange={setBookFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-emerald-600" />
              </div>
              {selectedBook ? 'Edit Book' : 'Add New Book'}
            </DialogTitle>
            <DialogDescription>
              {selectedBook ? 'Update book details below' : 'Fill in the details to add a new book to the library'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Book Title <span className="text-red-500">*</span></Label>
              <Input
                value={bookForm.name}
                onChange={e => { setBookForm({ ...bookForm, name: e.target.value }); setFormErrors(prev => ({ ...prev, name: '' })); }}
                placeholder="Enter book title"
                className={formErrors.name ? 'border-red-300 focus-visible:ring-red-200' : ''}
              />
              {formErrors.name && <p className="text-xs text-red-500">{formErrors.name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Author</Label>
                <Input
                  value={bookForm.author}
                  onChange={e => setBookForm({ ...bookForm, author: e.target.value })}
                  placeholder="Author name"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">ISBN</Label>
                <Input
                  value={bookForm.isbn}
                  onChange={e => setBookForm({ ...bookForm, isbn: e.target.value })}
                  placeholder="978-..."
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Category</Label>
                <Select value={bookForm.category} onValueChange={v => setBookForm({ ...bookForm, category: v })}>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    <SelectItem value="Fiction">Fiction</SelectItem>
                    <SelectItem value="Non-Fiction">Non-Fiction</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="History">History</SelectItem>
                    <SelectItem value="Geography">Geography</SelectItem>
                    <SelectItem value="Reference">Reference</SelectItem>
                    <SelectItem value="Textbook">Textbook</SelectItem>
                    <SelectItem value="Storybook">Storybook</SelectItem>
                    <SelectItem value="Dictionary">Dictionary</SelectItem>
                    <SelectItem value="Encyclopedia">Encyclopedia</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Shelf Location</Label>
                <Input
                  value={bookForm.shelf}
                  onChange={e => setBookForm({ ...bookForm, shelf: e.target.value })}
                  placeholder="e.g. A-12, Row 3"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-medium">Description</Label>
              <Textarea
                value={bookForm.description}
                onChange={e => setBookForm({ ...bookForm, description: e.target.value })}
                rows={2}
                placeholder="Brief description of the book..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Price (GHS)</Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={bookForm.price}
                  onChange={e => { setBookForm({ ...bookForm, price: e.target.value }); setFormErrors(prev => ({ ...prev, price: '' })); }}
                  placeholder="0.00"
                  className={formErrors.price ? 'border-red-300 focus-visible:ring-red-200' : ''}
                />
                {formErrors.price && <p className="text-xs text-red-500">{formErrors.price}</p>}
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Total Copies <span className="text-red-500">*</span></Label>
                <Input
                  type="number" min="0"
                  value={bookForm.total_copies}
                  onChange={e => { setBookForm({ ...bookForm, total_copies: e.target.value }); setFormErrors(prev => ({ ...prev, total_copies: '' })); }}
                  placeholder="1"
                  className={formErrors.total_copies ? 'border-red-300 focus-visible:ring-red-200' : ''}
                />
                {formErrors.total_copies && <p className="text-xs text-red-500">{formErrors.total_copies}</p>}
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Status</Label>
                <Select value={bookForm.status} onValueChange={v => setBookForm({ ...bookForm, status: v })}>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setBookFormOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button
              onClick={handleSaveBook}
              disabled={saving || !bookForm.name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {selectedBook ? 'Update Book' : 'Add Book'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue Book Dialog */}
      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                <ArrowRightLeft className="w-4 h-4 text-sky-600" />
              </div>
              Issue Book
            </DialogTitle>
            <DialogDescription>
              {selectedBook?.name} by {selectedBook?.author}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Student search */}
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Search Student <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name or student code..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="pl-10 min-h-[44px] mb-2"
                />
              </div>
              <Select value={issueForm.student_id} onValueChange={v => setIssueForm({ ...issueForm, student_id: v })}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select student to issue to" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {filteredStudents.length === 0 ? (
                    <SelectItem value="__none__" disabled>No students found</SelectItem>
                  ) : (
                    filteredStudents.map(s => (
                      <SelectItem key={s.student_id} value={s.student_id.toString()}>
                        <span className="flex items-center gap-2">
                          <User className="w-3 h-3 text-slate-400" />
                          {s.name} ({s.student_code})
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-medium">Return Date</Label>
              <Input
                type="date"
                value={issueForm.issue_end_date}
                onChange={e => setIssueForm({ ...issueForm, issue_end_date: e.target.value })}
                className="min-h-[44px]"
              />
            </div>

            {selectedBook && (
              <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
                <p className="text-xs font-medium text-slate-700">Book Details</p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Available copies</span>
                  <span className="font-medium text-emerald-600">{selectedBook.total_copies - selectedBook.issued_copies} of {selectedBook.total_copies}</span>
                </div>
                {selectedBook.isbn && (
                  <p className="text-xs text-slate-400">ISBN: {selectedBook.isbn}</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIssueOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button
              onClick={handleIssue}
              disabled={saving || !issueForm.student_id}
              className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Issue Book
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              Delete Book
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Are you sure you want to delete <strong>{selectedBook?.name}</strong>?
                </p>
                {selectedBook && selectedBook.issued_copies > 0 && (
                  <p className="text-amber-600 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    This book has {selectedBook.issued_copies} active issue(s). They will also be deleted.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBook} className="bg-red-600 hover:bg-red-700 min-h-[44px]">
              Delete Book
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
