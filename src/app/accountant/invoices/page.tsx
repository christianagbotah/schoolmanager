"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  Receipt,
  Plus,
  Loader2,
  Search,
  Eye,
  FileText,
  CheckCircle2,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface InvoiceItem {
  invoice_id: number;
  invoice_code: string;
  title: string;
  description: string;
  amount: number;
  amount_paid: number;
  due: number;
  discount: number;
  status: string;
  year: string;
  term: string;
  class_name: string;
  creation_timestamp: string | null;
  payment_timestamp: string | null;
  student: { student_id: number; name: string; student_code: string };
  class?: { name: string };
}

interface StudentItem {
  student_id: number;
  student_code: string;
  name: string;
}

interface ClassItem {
  class_id: number;
  name: string;
}

interface BillItem {
  id: number;
  title: string;
  description: string;
  amount: number;
  bill_category_id: number | null;
}

// ─── Helpers ─────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "GHS", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}

function statusBadge(status: string) {
  switch (status) {
    case "paid": return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">Paid</Badge>;
    case "partial": return <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">Partial</Badge>;
    case "unpaid": return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Unpaid</Badge>;
    default: return <Badge variant="secondary">{status}</Badge>;
  }
}

// ─── Main Component ──────────────────────────────────────────
export default function AccountantInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ totalBilled: number; totalCollected: number; outstanding: number } | null>(null);
  const [stats, setStats] = useState<{ paid: number; partial: number; unpaid: number } | null>(null);
  const [page, setPage] = useState(1);

  // Create invoice dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createTab, setCreateTab] = useState("single");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectedBillItems, setSelectedBillItems] = useState<number[]>([]);
  const [invYear, setInvYear] = useState(new Date().getFullYear().toString());
  const [invTerm, setInvTerm] = useState("1");
  const [isCreating, setIsCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: string; text: string } | null>(null);

  // Invoice detail dialog
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "20", page: String(page) });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (classFilter) params.set("classId", classFilter);

      const res = await fetch(`/api/accountant/invoices?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setInvoices(data.invoices || []);
      setSummary(data.summary || null);
      setStats(data.stats || null);
    } catch {
      setError("Failed to load invoices");
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, classFilter, page]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  // Load supporting data for create dialog
  const openCreateDialog = async () => {
    setCreateOpen(true);
    setCreateMsg(null);
    try {
      const [stuRes, clsRes, billRes] = await Promise.all([
        fetch("/api/students?limit=500"),
        fetch("/api/classes?limit=50"),
        fetch("/api/bill-items"),
      ]);
      if (stuRes.ok) { const d = await stuRes.json(); setStudents(d.data || d.students || []); }
      if (clsRes.ok) { const d = await clsRes.json(); setClasses(Array.isArray(d) ? d : d.data || []); }
      if (billRes.ok) { const d = await billRes.json(); setBillItems(Array.isArray(d) ? d : d.bill_items || []); }
    } catch { /* silent */ }
  };

  // Load class students when class is selected
  const classStudents = selectedClass
    ? students.filter(s => {
        // Ideally filter by enrollment, but for now show all
        return true;
      })
    : [];

  const handleCreate = async () => {
    if (selectedStudents.length === 0 || selectedBillItems.length === 0) return;
    setIsCreating(true);
    setCreateMsg(null);
    try {
      const items = billItems.filter(b => selectedBillItems.includes(b.id));
      const body: any = {
        studentIds: selectedStudents,
        items,
        year: invYear,
        term: invTerm,
        classId: selectedClass ? parseInt(selectedClass) : null,
        className: classes.find(c => c.class_id === parseInt(selectedClass))?.name || "",
      };

      const res = await fetch("/api/accountant/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setCreateMsg({ type: "success", text: data.message || "Invoices created successfully" });
      setSelectedStudents([]);
      setSelectedBillItems([]);
      fetchInvoices();
    } catch {
      setCreateMsg({ type: "error", text: "Failed to create invoices" });
    } finally {
      setIsCreating(false);
    }
  };

  const toggleStudent = (id: number) => {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const toggleBillItem = (id: number) => {
    setSelectedBillItems(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const totalBillAmount = billItems.filter(b => selectedBillItems.includes(b.id)).reduce((s, b) => s + b.amount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Invoice Management</h1>
                <p className="text-sky-100 text-sm">Create and manage student invoices</p>
              </div>
            </div>
            <Button className="bg-white text-sky-700 hover:bg-sky-50 min-w-[44px] min-h-[44px] font-semibold" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />Create Invoice
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {summary && (
            <>
              <Card className="py-3 border-l-4 border-l-slate-500"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Total Billed</p><p className="text-lg font-bold text-slate-900 tabular-nums">{formatCurrency(summary.totalBilled)}</p></CardContent></Card>
              <Card className="py-3 border-l-4 border-l-emerald-500"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Collected</p><p className="text-lg font-bold text-emerald-600 tabular-nums">{formatCurrency(summary.totalCollected)}</p></CardContent></Card>
              <Card className="py-3 border-l-4 border-l-red-500"><CardContent className="px-3 pt-0 pb-0"><p className="text-xs text-slate-500">Outstanding</p><p className="text-lg font-bold text-red-600 tabular-nums">{formatCurrency(summary.outstanding)}</p></CardContent></Card>
            </>
          )}
          {stats && (
            <>
              <Card className="py-3 border-l-4 border-l-emerald-500"><CardContent className="px-3 pt-0 pb-0"><div className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /><p className="text-xs text-slate-500">Paid</p></div><p className="text-lg font-bold text-emerald-600">{stats.paid}</p></CardContent></Card>
              <Card className="py-3 border-l-4 border-l-red-500"><CardContent className="px-3 pt-0 pb-0"><div className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-500" /><p className="text-xs text-slate-500">Unpaid</p></div><p className="text-lg font-bold text-red-600">{stats.unpaid}</p></CardContent></Card>
            </>
          )}
        </div>

        {/* Filters */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input placeholder="Search by name or invoice code..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
                  <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={classFilter || "all"} onValueChange={(v) => { setClassFilter(v === "all" ? "" : v); setPage(1); }}>
                  <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map(c => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
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
              <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No invoices found</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Invoice</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Student</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Class</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden lg:table-cell">Description</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Amount</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Balance</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Date</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-center">View</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.invoice_id} className="hover:bg-slate-50">
                        <TableCell className="font-mono text-sm text-slate-700">{inv.invoice_code}</TableCell>
                        <TableCell className="font-medium text-sm">{inv.student?.name || "Unknown"}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-slate-500">{inv.class?.name || inv.class_name || "—"}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-slate-600 max-w-[180px] truncate">{inv.title}</TableCell>
                        <TableCell className="text-right font-semibold text-sm tabular-nums">{formatCurrency(inv.amount)}</TableCell>
                        <TableCell className="text-right font-semibold text-sm tabular-nums text-red-600">{formatCurrency(inv.due)}</TableCell>
                        <TableCell className="text-center">{statusBadge(inv.status)}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500">{inv.creation_timestamp ? format(new Date(inv.creation_timestamp), "MMM d, yyyy") : "—"}</TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelectedInvoice(inv)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-slate-500">Showing page {page}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Invoice Dialog */}
        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) { setSelectedStudents([]); setSelectedBillItems([]); setCreateMsg(null); } }}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              {createMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${createMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {createMsg.text}
                </div>
              )}

              {/* Mode toggle */}
              <Tabs value={createTab} onValueChange={setCreateTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="single" className="flex-1 min-h-[44px]"><FileText className="w-4 h-4 mr-2" />Single Invoice</TabsTrigger>
                  <TabsTrigger value="mass" className="flex-1 min-h-[44px]"><Receipt className="w-4 h-4 mr-2" />Mass Invoice</TabsTrigger>
                </TabsList>

                {/* Common fields */}
                <div className="grid grid-cols-3 gap-3 pt-4">
                  <div className="space-y-2">
                    <Label>Academic Year</Label>
                    <Input value={invYear} onChange={(e) => setInvYear(e.target.value)} placeholder="2024" />
                  </div>
                  <div className="space-y-2">
                    <Label>Term</Label>
                    <Select value={invTerm} onValueChange={setInvTerm}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Term 1</SelectItem>
                        <SelectItem value="2">Term 2</SelectItem>
                        <SelectItem value="3">Term 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedStudents([]); }}>
                      <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                      <SelectContent>{classes.map(c => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Student selection */}
                <div className="space-y-2">
                  <Label className="flex items-center justify-between">
                    <span>{createTab === "mass" ? "Select Students" : "Select Student"}</span>
                    {createTab === "mass" && selectedStudents.length > 0 && (
                      <span className="text-xs font-medium text-sky-600">{selectedStudents.length} selected</span>
                    )}
                  </Label>
                  <div className="max-h-48 overflow-y-auto rounded-lg border p-2">
                    <div className="relative mb-2">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input placeholder="Search students..." className="pl-9 h-8 text-sm" />
                    </div>
                    {students.length === 0 ? (
                      <p className="text-center text-slate-400 text-sm py-4">No students loaded</p>
                    ) : (
                      students.slice(0, 50).map(s => (
                        <button key={s.student_id} type="button" onClick={() => toggleStudent(s.student_id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors ${selectedStudents.includes(s.student_id) ? "bg-sky-50 border border-sky-200 text-sky-700" : "hover:bg-slate-50"}`}>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${selectedStudents.includes(s.student_id) ? "bg-sky-500 border-sky-500" : "border-slate-300"}`}>
                            {selectedStudents.includes(s.student_id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <span className="font-medium">{s.name}</span>
                          <span className="text-xs text-slate-400 ml-auto">{s.student_code}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Bill items selection */}
                <div className="space-y-2">
                  <Label className="flex items-center justify-between">
                    <span>Bill Items</span>
                    {selectedBillItems.length > 0 && (
                      <span className="text-xs font-medium text-emerald-600">Total: {formatCurrency(totalBillAmount)}</span>
                    )}
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto rounded-lg border p-2">
                    {billItems.length === 0 ? (
                      <div className="col-span-2 text-center text-slate-400 text-sm py-4">
                        <p>No bill items found.</p>
                        <p className="text-xs mt-1">Create bill items in Settings first.</p>
                      </div>
                    ) : billItems.map(b => (
                      <button key={b.id} type="button" onClick={() => toggleBillItem(b.id)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors ${selectedBillItems.includes(b.id) ? "bg-emerald-50 border border-emerald-200" : "border border-transparent hover:bg-slate-50"}`}>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${selectedBillItems.includes(b.id) ? "bg-emerald-500 border-emerald-500" : "border-slate-300"}`}>
                          {selectedBillItems.includes(b.id) && <span className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{b.title}</p>
                          <p className="text-xs text-emerald-600 font-semibold">{formatCurrency(b.amount)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </Tabs>

              {/* Submit */}
              <Button onClick={handleCreate} disabled={isCreating || selectedStudents.length === 0 || selectedBillItems.length === 0} className="w-full bg-sky-600 hover:bg-sky-700 min-h-[44px]">
                {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Create {createTab === "mass" ? `${selectedStudents.length} Invoices` : "Invoice"} ({formatCurrency(totalBillAmount)} each)
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Invoice Detail Dialog */}
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Invoice Details</DialogTitle></DialogHeader>
            {selectedInvoice && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-slate-500">Invoice Code</p><p className="font-mono font-semibold">{selectedInvoice.invoice_code}</p></div>
                  <div><p className="text-xs text-slate-500">Student</p><p className="font-semibold">{selectedInvoice.student?.name}</p></div>
                  <div><p className="text-xs text-slate-500">Class</p><p className="font-semibold">{selectedInvoice.class?.name || selectedInvoice.class_name || "—"}</p></div>
                  <div><p className="text-xs text-slate-500">Term / Year</p><p className="font-semibold">Term {selectedInvoice.term}, {selectedInvoice.year}</p></div>
                  <div><p className="text-xs text-slate-500">Amount</p><p className="font-semibold">{formatCurrency(selectedInvoice.amount)}</p></div>
                  <div><p className="text-xs text-slate-500">Paid</p><p className="font-semibold text-emerald-600">{formatCurrency(selectedInvoice.amount_paid)}</p></div>
                  <div><p className="text-xs text-slate-500">Balance</p><p className="font-semibold text-red-600">{formatCurrency(selectedInvoice.due)}</p></div>
                  <div><p className="text-xs text-slate-500">Status</p><div className="mt-0.5">{statusBadge(selectedInvoice.status)}</div></div>
                </div>
                {selectedInvoice.description && (
                  <div className="p-3 rounded-lg bg-slate-50"><p className="text-xs text-slate-500 mb-1">Description</p><p className="text-sm">{selectedInvoice.description}</p></div>
                )}
                <div className="text-xs text-slate-400 text-right">
                  Created: {selectedInvoice.creation_timestamp ? format(new Date(selectedInvoice.creation_timestamp), "PPP p") : "—"}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
