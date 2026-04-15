'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { BookOpen, Plus, Search, Pencil, Trash2, Users, CheckCircle, XCircle, BookCheck } from 'lucide-react';
import { format } from 'date-fns';

interface Book {
  book_id: number; name: string; description: string; author: string;
  class_id: number | null; price: number; total_copies: number;
  issued_copies: number; status: string; available_copies?: number; active_requests?: number;
}

interface BookRequest {
  book_request_id: number; book_id: number; student_id: number;
  issue_start_date: string | null; issue_end_date: string | null; status: string;
  book: { book_id: number; name: string; author: string } | null;
  student: { student_id: number; name: string; student_code: string } | null;
}

interface Student { student_id: number; name: string; student_code: string; }

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [bookFormOpen, setBookFormOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [activeTab, setActiveTab] = useState('books');

  const [bookForm, setBookForm] = useState({ name: '', description: '', author: '', class_id: '', price: '', total_copies: '', status: 'available' });
  const [issueForm, setIssueForm] = useState({ student_id: '', book_id: '', issue_end_date: '' });

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const [booksRes, reqRes, stRes] = await Promise.all([
        fetch(`/api/admin/books?${params}`),
        fetch('/api/admin/book-requests'),
        fetch('/api/admin/students'),
      ]);
      setBooks(await booksRes.json());
      setRequests(await reqRes.json());
      const stData = await stRes.json();
      setStudents(Array.isArray(stData) ? stData.slice(0, 200) : []);
    } catch { /* empty */ }
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const openCreateBook = () => {
    setSelectedBook(null);
    setBookForm({ name: '', description: '', author: '', class_id: '', price: '', total_copies: '1', status: 'available' });
    setBookFormOpen(true);
  };

  const openEditBook = (b: Book) => {
    setSelectedBook(b);
    setBookForm({ name: b.name, description: b.description, author: b.author, class_id: b.class_id?.toString() || '', price: b.price.toString(), total_copies: b.total_copies.toString(), status: b.status });
    setBookFormOpen(true);
  };

  const handleSaveBook = async () => {
    try {
      const url = selectedBook ? `/api/admin/books?id=${selectedBook.book_id}` : '/api/admin/books';
      const method = selectedBook ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bookForm) });
      if (!res.ok) throw new Error('Failed');
      toast.success(selectedBook ? 'Book updated' : 'Book created');
      setBookFormOpen(false); fetchBooks();
    } catch { toast.error('Failed to save book'); }
  };

  const handleDeleteBook = async () => {
    if (!selectedBook) return;
    try {
      const res = await fetch(`/api/admin/books?id=${selectedBook.book_id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success('Book deleted'); setDeleteOpen(false); fetchBooks();
    } catch { toast.error('Failed to delete'); }
  };

  const openIssue = (book: Book) => {
    setSelectedBook(book);
    setIssueForm({ student_id: '', book_id: book.book_id.toString(), issue_end_date: '' });
    setIssueOpen(true);
  };

  const handleIssue = async () => {
    try {
      const res = await fetch('/api/admin/book-requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...issueForm, status: 'issued' }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      toast.success('Book issued'); setIssueOpen(false); fetchBooks();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleReturn = async (req: BookRequest) => {
    try {
      await fetch('/api/admin/book-requests', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_request_id: req.book_request_id, status: 'returned' }),
      });
      toast.success('Book returned'); fetchBooks();
    } catch { toast.error('Failed to return'); }
  };

  const totalBooks = books.reduce((s, b) => s + b.total_copies, 0);
  const issuedBooks = books.reduce((s, b) => s + b.issued_copies, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Library Management</h1>
          <p className="text-sm text-slate-500 mt-1">Books, issues and returns</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><BookOpen className="w-5 h-5 text-emerald-600" /></div>
            <div><p className="text-xs text-slate-500">Total Copies</p><p className="text-xl font-bold">{totalBooks}</p></div>
          </CardContent></Card>
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center"><BookCheck className="w-5 h-5 text-sky-600" /></div>
            <div><p className="text-xs text-slate-500">Available</p><p className="text-xl font-bold">{totalBooks - issuedBooks}</p></div>
          </CardContent></Card>
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><XCircle className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-xs text-slate-500">Issued</p><p className="text-xl font-bold">{issuedBooks}</p></div>
          </CardContent></Card>
          <Card className="border-slate-200/60"><CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center"><Users className="w-5 h-5 text-violet-600" /></div>
            <div><p className="text-xs text-slate-500">Active Issues</p><p className="text-xl font-bold">{requests.filter(r => r.status === 'issued').length}</p></div>
          </CardContent></Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 bg-white border border-slate-200 p-1 rounded-xl h-auto flex w-full sm:w-auto">
            <TabsTrigger value="books" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <BookOpen className="w-4 h-4 mr-1 hidden sm:inline" /> Books
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <BookCheck className="w-4 h-4 mr-1 hidden sm:inline" /> Issues & Returns
            </TabsTrigger>
          </TabsList>

          <TabsContent value="books">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search by title or author..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 min-h-[44px]" />
              </div>
              <Button onClick={openCreateBook} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"><Plus className="w-4 h-4 mr-2" /> Add Book</Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {books.map(book => {
                  const available = book.total_copies - book.issued_copies;
                  return (
                    <Card key={book.book_id} className="hover:shadow-md transition-shadow border-slate-200/60">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0"><BookOpen className="w-4 h-4 text-emerald-600" /></div>
                            <div className="min-w-0"><h3 className="font-semibold text-slate-900 text-sm truncate">{book.name}</h3><p className="text-xs text-slate-500">{book.author || 'Unknown'}</p></div>
                          </div>
                          <Badge variant={available > 0 ? 'default' : 'destructive'} className="text-xs flex-shrink-0">{available > 0 ? `${available} avail` : 'Out'}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                          <span>Total: {book.total_copies}</span><span>Issued: {book.issued_copies}</span>
                          {book.price > 0 && <span>GHS {book.price}</span>}
                        </div>
                        {book.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{book.description}</p>}
                        <div className="flex gap-1 mt-3 pt-3 border-t border-slate-100">
                          {available > 0 && <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600" onClick={() => openIssue(book)}><CheckCircle className="w-3 h-3 mr-1" /> Issue</Button>}
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openEditBook(book)}><Pencil className="w-3 h-3" /></Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600" onClick={() => { setSelectedBook(book); setDeleteOpen(true); }}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests">
            <Card className="border-slate-200/60"><CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600">Student</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600">Book</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 hidden sm:table-cell">Issued</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 hidden sm:table-cell">Due</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-8">No book requests</TableCell></TableRow>
                    ) : requests.map(req => (
                      <TableRow key={req.book_request_id}>
                        <TableCell className="text-sm">{req.student?.name || '—'}</TableCell>
                        <TableCell className="text-sm">{req.book?.name || '—'}</TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-slate-500">{req.issue_start_date ? format(new Date(req.issue_start_date), 'MMM d, yyyy') : '—'}</TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-slate-500">{req.issue_end_date ? format(new Date(req.issue_end_date), 'MMM d, yyyy') : '—'}</TableCell>
                        <TableCell>
                          <Badge variant={req.status === 'issued' ? 'default' : 'secondary'} className="text-xs">{req.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {req.status === 'issued' && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600" onClick={() => handleReturn(req)}>
                              <XCircle className="w-3 h-3 mr-1" /> Return
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={bookFormOpen} onOpenChange={setBookFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selectedBook ? 'Edit Book' : 'Add New Book'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label className="text-xs">Book Title *</Label><Input value={bookForm.name} onChange={e => setBookForm({ ...bookForm, name: e.target.value })} placeholder="Enter book title" /></div>
            <div className="grid gap-2"><Label className="text-xs">Author</Label><Input value={bookForm.author} onChange={e => setBookForm({ ...bookForm, author: e.target.value })} /></div>
            <div className="grid gap-2"><Label className="text-xs">Description</Label><Textarea value={bookForm.description} onChange={e => setBookForm({ ...bookForm, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label className="text-xs">Price (GHS)</Label><Input type="number" value={bookForm.price} onChange={e => setBookForm({ ...bookForm, price: e.target.value })} /></div>
              <div className="grid gap-2"><Label className="text-xs">Total Copies</Label><Input type="number" value={bookForm.total_copies} onChange={e => setBookForm({ ...bookForm, total_copies: e.target.value })} /></div>
            </div>
            <div className="grid gap-2"><Label className="text-xs">Status</Label><Select value={bookForm.status} onValueChange={v => setBookForm({ ...bookForm, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="available">Available</SelectItem><SelectItem value="unavailable">Unavailable</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setBookFormOpen(false)}>Cancel</Button><Button onClick={handleSaveBook} className="bg-emerald-600 hover:bg-emerald-700" disabled={!bookForm.name.trim()}>{selectedBook ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Issue Book: {selectedBook?.name}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label className="text-xs">Student *</Label><Select value={issueForm.student_id} onValueChange={v => setIssueForm({ ...issueForm, student_id: v })}><SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger><SelectContent className="max-h-60">{students.map(s => <SelectItem key={s.student_id} value={s.student_id.toString()}>{s.name} ({s.student_code})</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label className="text-xs">Return Date</Label><Input type="date" value={issueForm.issue_end_date} onChange={e => setIssueForm({ ...issueForm, issue_end_date: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIssueOpen(false)}>Cancel</Button><Button onClick={handleIssue} className="bg-emerald-600 hover:bg-emerald-700" disabled={!issueForm.student_id}>Issue</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Book</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete <strong>{selectedBook?.name}</strong>?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteBook} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
