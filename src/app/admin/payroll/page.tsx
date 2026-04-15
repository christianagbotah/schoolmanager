"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Banknote, DollarSign, CheckCircle, Clock, Users, CalendarDays,
  Eye, FileText, AlertCircle, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Employee { id: number; emp_id: string; name: string; salary: number; active_status: number; department: { dep_name: string } | null; designation: { des_name: string } | null; }
interface Salary { pay_id: number; employee_code: string; month: string; year: string; basic_salary: number; gross_salary: number; net_salary: number; status: string; employee: Employee | null; }

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function fmt(n: number) { return `GHS ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

export default function PayrollPage() {
  const { toast } = useToast();
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [filterStatus, setFilterStatus] = useState("all");
  const [processing, setProcessing] = useState(false);
  const [payslipOpen, setPayslipOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<Salary | null>(null);
  const [activeTab, setActiveTab] = useState("payroll");

  const [payOpen, setPayOpen] = useState(false);
  const [payForm, setPayForm] = useState({ employee_code: "", month: "", year: "", basic_salary: "", allowance: "", deduction: "", net_salary: "" });
  const [paySaving, setPaySaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ month: selectedMonth, year: selectedYear });
      if (filterStatus !== "all") params.set("status", filterStatus);
      const [salRes, empRes] = await Promise.all([fetch(`/api/payroll?${params}`), fetch("/api/employees?limit=300")]);
      if (!salRes.ok) throw new Error("Failed to load payroll data");
      setSalaries(await salRes.json());
      const empData = await empRes.json();
      setEmployees(Array.isArray(empData) ? empData : []);
    } catch {
      setError("Failed to load payroll data");
    }
    setLoading(false);
  }, [selectedMonth, selectedYear, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleBulkProcess = async () => {
    setProcessing(true);
    try {
      const activeEmployees = employees.filter(e => e.active_status === 1);
      if (activeEmployees.length === 0) { toast({ title: "No active employees", variant: "destructive" }); setProcessing(false); return; }
      const empPayload = activeEmployees.map(e => ({ emp_id: e.emp_id, salary: e.salary, gross_salary: Math.round(e.salary * 1.1 * 100) / 100, net_salary: Math.round(e.salary * 0.9 * 100) / 100 }));
      const res = await fetch("/api/payroll", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ month: selectedMonth, year: selectedYear, employees: empPayload }) });
      if (!res.ok) throw new Error();
      toast({ title: "Success", description: `Payroll processed for ${empPayload.length} employees` });
      fetchData();
    } catch {
      toast({ title: "Payroll processing failed", variant: "destructive" });
    }
    setProcessing(false);
  };

  const handleIndividualPay = async () => {
    if (!payForm.employee_code || !payForm.basic_salary) return;
    setPaySaving(true);
    try {
      const allowance = parseFloat(payForm.allowance || "0");
      const deduction = parseFloat(payForm.deduction || "0");
      const basic = parseFloat(payForm.basic_salary);
      await fetch("/api/payroll", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ employee_code: payForm.employee_code, month: payForm.month, year: payForm.year, basic_salary: basic, gross_salary: basic + allowance, net_salary: basic + allowance - deduction }) });
      toast({ title: "Success", description: "Salary recorded" }); setPayOpen(false); fetchData();
    } catch {
      toast({ title: "Error recording salary", variant: "destructive" });
    }
    setPaySaving(false);
  };

  const totalGross = salaries.reduce((s, sl) => s + sl.gross_salary, 0);
  const totalNet = salaries.reduce((s, sl) => s + sl.net_salary, 0);
  const processed = salaries.filter(s => s.status === "processed").length;
  const pending = salaries.filter(s => s.status === "pending").length;
  const years = [String(new Date().getFullYear()), String(new Date().getFullYear() - 1), String(new Date().getFullYear() - 2)];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Banknote className="w-6 h-6" /></div>
              <div><h1 className="text-lg font-bold">Payroll</h1><p className="text-emerald-200 text-xs hidden sm:block">Salary Processing & Reports</p></div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />) : (
            <>
              <MiniStat icon={Users} label="Total Staff" value={employees.length} color="emerald" />
              <MiniStat icon={CheckCircle} label="Processed" value={processed} color="sky" />
              <MiniStat icon={Clock} label="Pending" value={pending} color="amber" />
              <MiniStat icon={Banknote} label="Net Total" value={fmt(totalNet)} color="violet" />
            </>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 bg-white border border-slate-200 p-1 rounded-xl h-auto flex w-full sm:w-auto">
            <TabsTrigger value="payroll" className="flex-1 min-w-[90px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm"><Banknote className="w-4 h-4 mr-1" /> Payroll</TabsTrigger>
            <TabsTrigger value="reports" className="flex-1 min-w-[90px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm"><FileText className="w-4 h-4 mr-1" /> Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="payroll">
            <Card className="border-slate-200/60 mb-6"><CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  <CalendarDays className="w-5 h-5 text-slate-500" />
                  <Select value={selectedMonth} onValueChange={v => setSelectedMonth(v)}><SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}</SelectContent></Select>
                  <Select value={selectedYear} onValueChange={v => setSelectedYear(v)}><SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger><SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="processed">Processed</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent></Select>
                </div>
                <div className="sm:ml-auto flex gap-2">
                  <Button variant="outline" onClick={() => { setPayForm({ employee_code: "", month: selectedMonth, year: selectedYear, basic_salary: "", allowance: "", deduction: "", net_salary: "" }); setPayOpen(true); }} className="min-h-[44px]"><Banknote className="w-4 h-4 mr-2" /> Individual</Button>
                  <Button onClick={handleBulkProcess} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]" disabled={processing}>{processing ? "Processing..." : "Process Payroll"}</Button>
                </div>
              </div>
            </CardContent></Card>

            {error && (
              <Card className="border-red-200 mb-4"><CardContent className="p-6 flex flex-col items-center text-center">
                <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
                <p className="font-medium text-slate-900">{error}</p>
                <Button variant="outline" className="mt-3" onClick={fetchData}><RefreshCw className="w-4 h-4 mr-2" /> Retry</Button>
              </CardContent></Card>
            )}

            <Card className="border-slate-200/60"><CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                {/* Desktop */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader><TableRow className="bg-slate-50"><TableHead>Employee</TableHead><TableHead>Department</TableHead><TableHead className="text-right">Basic (GHS)</TableHead><TableHead className="text-right">Gross (GHS)</TableHead><TableHead className="text-right">Net (GHS)</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
                    <TableBody>
                      {loading ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-8" /></TableCell></TableRow>) :
                        salaries.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center text-slate-400 py-8">No payroll records for {MONTHS[parseInt(selectedMonth) - 1]} {selectedYear}</TableCell></TableRow> :
                          salaries.map(sal => (
                            <TableRow key={sal.pay_id}>
                              <TableCell className="font-medium text-sm">{sal.employee?.name || sal.employee_code}</TableCell>
                              <TableCell className="text-xs text-slate-500">{sal.employee?.department?.dep_name || "—"}</TableCell>
                              <TableCell className="text-right text-sm">{sal.basic_salary.toLocaleString()}</TableCell>
                              <TableCell className="text-right text-sm">{sal.gross_salary.toLocaleString()}</TableCell>
                              <TableCell className="text-right font-medium text-sm">{sal.net_salary.toLocaleString()}</TableCell>
                              <TableCell><Badge className={sal.status === "processed" ? "bg-emerald-100 text-emerald-700 text-xs" : "bg-amber-100 text-amber-700 text-xs"}>{sal.status}</Badge></TableCell>
                              <TableCell><Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setSelectedSalary(sal); setPayslipOpen(true); }}><Eye className="w-3 h-3 mr-1" />View</Button></TableCell>
                            </TableRow>
                          ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile */}
                <div className="md:hidden divide-y">
                  {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="p-4"><Skeleton className="h-16 rounded-lg" /></div>) :
                    salaries.length === 0 ? <div className="text-center py-12 text-slate-400"><Banknote className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No payroll records</p></div> :
                      salaries.map(sal => (
                        <div key={sal.pay_id} className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0"><p className="font-medium text-sm truncate">{sal.employee?.name || sal.employee_code}</p><p className="text-xs text-slate-500">{sal.employee?.department?.dep_name || ""}</p></div>
                            <Badge className={sal.status === "processed" ? "bg-emerald-100 text-emerald-700 text-xs" : "bg-amber-100 text-amber-700 text-xs"}>{sal.status}</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-slate-50 rounded-lg p-2 text-center"><p className="text-[10px] text-slate-500">Basic</p><p className="text-xs font-bold">{sal.basic_salary.toLocaleString()}</p></div>
                            <div className="bg-slate-50 rounded-lg p-2 text-center"><p className="text-[10px] text-slate-500">Gross</p><p className="text-xs font-bold">{sal.gross_salary.toLocaleString()}</p></div>
                            <div className="bg-emerald-50 rounded-lg p-2 text-center"><p className="text-[10px] text-slate-500">Net</p><p className="text-xs font-bold text-emerald-700">{sal.net_salary.toLocaleString()}</p></div>
                          </div>
                          <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => { setSelectedSalary(sal); setPayslipOpen(true); }}><Eye className="w-3 h-3 mr-1" /> View Payslip</Button>
                        </div>
                      ))}
                </div>
              </div>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="reports">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-slate-200/60"><CardHeader><CardTitle className="text-base">Summary — {MONTHS[parseInt(selectedMonth) - 1]} {selectedYear}</CardTitle></CardHeader><CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-sm">Total Basic</span><span className="font-mono font-bold">GHS {salaries.reduce((s, sl) => s + sl.basic_salary, 0).toLocaleString()}</span></div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-sm">Total Gross</span><span className="font-mono font-bold">GHS {totalGross.toLocaleString()}</span></div>
                  <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg"><span className="text-sm font-medium text-emerald-700">Total Net</span><span className="font-mono font-bold text-emerald-700">GHS {totalNet.toLocaleString()}</span></div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-sm">Processed</span><span className="font-mono">{processed} / {salaries.length}</span></div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${salaries.length ? (processed / salaries.length) * 100 : 0}%` }} /></div>
                </div>
              </CardContent></Card>
              <Card className="border-slate-200/60"><CardHeader><CardTitle className="text-base">Top Salaries</CardTitle></CardHeader><CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">{salaries.filter(s => s.status === "processed").sort((a, b) => b.net_salary - a.net_salary).slice(0, 10).map((s, i) => (
                  <div key={s.pay_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                    <div className="flex items-center gap-3"><span className="text-xs text-slate-400 w-5">{i + 1}</span><span className="text-sm font-medium">{s.employee?.name || s.employee_code}</span></div>
                    <span className="font-mono text-sm font-bold">GHS {s.net_salary.toLocaleString()}</span>
                  </div>
                ))}</div>
              </CardContent></Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={payslipOpen} onOpenChange={setPayslipOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Payslip Details</DialogTitle></DialogHeader>
        {selectedSalary && (<div className="space-y-4">
          <div className="bg-emerald-50 rounded-lg p-4 text-center"><p className="text-sm text-emerald-600">Payslip for</p><p className="text-lg font-bold">{selectedSalary.employee?.name || selectedSalary.employee_code}</p><p className="text-xs text-emerald-500">{MONTHS[parseInt(selectedSalary.month) - 1]} {selectedSalary.year}</p></div>
          <div className="space-y-2">{[["Basic Salary", selectedSalary.basic_salary], ["Gross Salary", selectedSalary.gross_salary], ["Net Salary", selectedSalary.net_salary]].map(([label, val]) => (<div key={label as string} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-sm">{label}</span><span className="font-mono font-bold">GHS {val.toLocaleString()}</span></div>))}</div>
          <div className="flex justify-between items-center"><span className="text-sm text-slate-500">Status</span><Badge className={selectedSalary.status === "processed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>{selectedSalary.status}</Badge></div>
        </div>)}
      </DialogContent></Dialog>

      <Dialog open={payOpen} onOpenChange={setPayOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Record Individual Salary</DialogTitle><DialogDescription>Manually record salary for a specific employee</DialogDescription></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2"><Label>Employee *</Label><Select value={payForm.employee_code} onValueChange={v => { const emp = employees.find(e => e.emp_id === v); setPayForm({ ...payForm, employee_code: v, basic_salary: emp?.salary.toString() || "" }); }}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent className="max-h-48">{employees.filter(e => e.active_status === 1).map(e => <SelectItem key={e.emp_id} value={e.emp_id}>{e.name} ({e.emp_id})</SelectItem>)}</SelectContent></Select></div>
          <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>Month</Label><Select value={payForm.month} onValueChange={v => setPayForm({ ...payForm, month: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label>Year</Label><Select value={payForm.year} onValueChange={v => setPayForm({ ...payForm, year: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select></div></div>
          <div className="grid grid-cols-3 gap-4"><div className="grid gap-2"><Label>Basic *</Label><Input type="number" value={payForm.basic_salary} onChange={e => setPayForm({ ...payForm, basic_salary: e.target.value })} /></div><div className="grid gap-2"><Label>Allowance</Label><Input type="number" value={payForm.allowance} onChange={e => setPayForm({ ...payForm, allowance: e.target.value })} /></div><div className="grid gap-2"><Label>Deduction</Label><Input type="number" value={payForm.deduction} onChange={e => setPayForm({ ...payForm, deduction: e.target.value })} /></div></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button><Button onClick={handleIndividualPay} disabled={!payForm.employee_code || !payForm.basic_salary} className="bg-emerald-600 hover:bg-emerald-700">{paySaving ? "Saving..." : "Record Salary"}</Button></DialogFooter>
      </DialogContent></Dialog>

      <footer className="bg-white border-t border-slate-200 py-4 mt-auto"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"><p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} School Manager</p></div></footer>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  const c: Record<string, string> = { emerald: "bg-emerald-100 text-emerald-600", sky: "bg-sky-100 text-sky-600", amber: "bg-amber-100 text-amber-600", violet: "bg-violet-100 text-violet-600" };
  return (<Card className="border-slate-200/60"><CardContent className="p-4"><div className={`w-8 h-8 rounded-lg ${c[color]} flex items-center justify-center mb-2`}><Icon className="w-4 h-4" /></div><p className="text-lg font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500">{label}</p></CardContent></Card>);
}
