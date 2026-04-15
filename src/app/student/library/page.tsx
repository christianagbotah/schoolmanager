"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BookOpen,
  Search,
  Plus,
  Clock,
  Loader2,
  AlertTriangle,
  CheckCircle,
  BookCheck,
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
  DialogTrigger,
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
  available: number;
  copies: number;
}

interface BookRequest {
  id: number;
  book_id: number;
  student_id: number;
  status: string;
  request_date: string;
  return_date: string | null;
  book: { name: string; author: string };
}

// ─── Main Component ──────────────────────────────────────────
export default function StudentLibraryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"browse" | "my-requests">("browse");

  // Request dialog
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestBookId, setRequestBookId] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/student/library");
      if (!res.ok) throw new Error("Failed to load library data");
      const data = await res.json();
      setBooks(data.books || []);
      setRequests(data.requests || []);
    } catch { setError("Failed to load library data"); }
    finally { setIsLoading(false); }
  }, [user?.id]);

  useEffect(() => { if (!authLoading) fetchData(); }, [authLoading, fetchData]);

  const handleRequest = async () => {
    if (!requestBookId) return;
    setIsRequesting(true);
    try {
      const res = await fetch("/api/student/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book_id: parseInt(requestBookId) }),
      });
      if (!res.ok) throw new Error("Failed");
      setSuccessMsg("Book request submitted");
      setRequestOpen(false);
      setRequestBookId("");
      fetchData();
    } catch { setError("Failed to submit request"); }
    finally { setIsRequesting(false); }
  };

  const filteredBooks = books.filter((b) => {
    const q = search.toLowerCase();
    return b.name?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q);
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6"><Skeleton className="h-8 w-48" /><div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Library</h1>
          <p className="text-sm text-slate-500 mt-1">Browse books and manage your requests</p>
        </div>

        {successMsg && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />{successMsg}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
          </div>
        )}

        <div className="flex gap-2">
          <Button variant={tab === "browse" ? "default" : "outline"} onClick={() => setTab("browse")} className={`min-w-[44px] min-h-[44px] ${tab === "browse" ? "bg-amber-600 hover:bg-amber-700" : ""}`}>
            <BookOpen className="w-4 h-4 mr-2" />Browse Books
          </Button>
          <Button variant={tab === "my-requests" ? "default" : "outline"} onClick={() => setTab("my-requests")} className={`min-w-[44px] min-h-[44px] ${tab === "my-requests" ? "bg-amber-600 hover:bg-amber-700" : ""}`}>
            <BookCheck className="w-4 h-4 mr-2" />My Requests ({requests.length})
          </Button>
        </div>

        {tab === "browse" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search books..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Card className="gap-4">
              <CardContent className="pt-6">
                {filteredBooks.length === 0 ? (
                  <div className="text-center py-12"><BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No books found</p></div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                    {filteredBooks.map((book) => (
                      <Card key={book.book_id} className="gap-0 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-sm text-slate-900 truncate">{book.name}</h4>
                          <p className="text-xs text-slate-500">{book.author}</p>
                          <Badge variant={book.available > 0 ? "default" : "destructive"} className={`mt-2 text-xs ${book.available > 0 ? "bg-emerald-100 text-emerald-700" : ""}`}>
                            {book.available > 0 ? `${book.available} available` : "Unavailable"}
                          </Badge>
                          {book.available > 0 && (
                            <Button variant="outline" size="sm" className="w-full mt-3 min-h-[44px]" onClick={() => { setRequestBookId(String(book.book_id)); setRequestOpen(true); }}>
                              Request Book
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "my-requests" && (
          <Card className="gap-4">
            <CardContent className="pt-6">
              {requests.length === 0 ? (
                <div className="text-center py-12"><BookCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No book requests yet</p></div>
              ) : (
                <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase">Book</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Status</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Request Date</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Return Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((req) => (
                        <TableRow key={req.id} className="hover:bg-slate-50">
                          <TableCell className="text-sm font-medium">{req.book?.name || "—"}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className={req.status === "approved" ? "bg-emerald-100 text-emerald-700" : req.status === "returned" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}>
                              {req.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-xs text-slate-400">{req.request_date ? format(new Date(req.request_date), "MMM d, yyyy") : "—"}</TableCell>
                          <TableCell className="hidden sm:table-cell text-xs text-slate-400">{req.return_date ? format(new Date(req.return_date), "MMM d, yyyy") : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Request Book</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <p className="text-sm text-slate-500">Confirm your book request? The librarian will review and approve it.</p>
              <Button onClick={handleRequest} disabled={isRequesting} className="w-full bg-amber-600 hover:bg-amber-700 min-h-[44px]">
                {isRequesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}Confirm Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
