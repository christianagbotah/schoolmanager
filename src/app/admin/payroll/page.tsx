"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Search, DollarSign, CheckCircle, Clock, Users, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: number; emp_id: string; name: string; salary: number;
  department: { dep_name: string } | null;
  designation: { des_name: string } | null;
}

interface Salary {
  pay_id: number; employee_code: string; month: string; year: string;
  basic_salary: number; gross_salary: number; net_salary: number; status: string;
  employee: Employee | null;
}

export default function PayrollPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1).toString();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [filterStatus, setFilterStatus] = useState("all");
  const [processing, setProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ month: selectedMonth, year: selectedYear });
      if (filterStatus !== "all") params.set("status", filterStatus);

      const [salRes, empRes] = await Promise.all([
        fetch(`/api/payroll/route?${params}`),
        fetch("/api/employees/route"),
      ]);
      setSalaries(await salRes.json());
      const empData = await empRes.json();
      setEmployees(Array.isArray(empData) ? empData : []);
    } catch { /* empty */ }
    setLoading(false);
  }, [selectedMonth, selectedYear, filterStatus]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleBulkProcess = async () => {
    setProcessing(true);
    try {
      const empPayload = employees.filter(e => e.active_status === 1).map(e => ({
        emp_id: e.emp_id,
        salary: e.salary,
        gross_salary: e.salary * 1.1,
        net_salary: e.salary * 0.9,
      }));

      await fetch("/api/payroll/route", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear, employees: empPayload }),
      });
      toast({ title: "Success", description: "Payroll processed" });
      fetchData();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
    setProcessing(false);
  };

  const totalGross = salaries.reduce((s, sl) => s + sl.gross_salary, 0);
  const totalNet = salaries.reduce((s, sl) => s + sl.net_salary, 0);
  const processed = salaries.filter(s => s.status === "processed").length;

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-emerald-700 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Banknote className="w-6 h-6" /></div>
              <div><h1 className="text-lg font-bold">Payroll</h1><p className="text-emerald-200 text-xs hidden sm:block">Salary Processing</p></div>
            </div>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => router.push("/")}>Dashboard</Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Users} label="Total Staff" value={employees.length} color="emerald" />
          <StatCard icon={CheckCircle} label="Processed" value={processed} color="blue" />
          <StatCard icon={DollarSign} label="Gross Total" value={`GHS ${totalGross.toLocaleString()}`} color="amber" />
          <StatCard icon={Banknote} label="Net Total" value={`GHS ${totalNet.toLocaleString()}`} color="purple" />
        </div>

        {/* Controls */}
        <Card className="border-slate-200/60 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 flex-shrink-0">
                <CalendarDays className="w-5 h-5 text-slate-500" />
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{months.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="2025">2025</SelectItem><SelectItem value="2024">2024</SelectItem></SelectContent>
                </Select>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="processed">Processed</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent>
              </Select>
              <div className="sm:ml-auto">
                <Button onClick={handleBulkProcess} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]" disabled={processing}>
                  {processing ? "Processing..." : "Process Payroll"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-slate-200/60"><CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader><TableRow className="bg-slate-50"><TableHead>Employee</TableHead><TableHead className="hidden sm:table-cell">Department</TableHead><TableHead>Basic (GHS)</TableHead><TableHead>Gross (GHS)</TableHead><TableHead>Net (GHS)</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8" /></TableCell></TableRow>) :
                  salaries.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-8">No payroll records for {months[parseInt(selectedMonth) - 1]} {selectedYear}</TableCell></TableRow> :
                    salaries.map(sal => (
                      <TableRow key={sal.pay_id}>
                        <TableCell className="font-medium text-sm">{sal.employee?.name || sal.employee_code}</TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-slate-500">{sal.employee?.department?.dep_name || "—"}</TableCell>
                        <TableCell className="text-sm">{sal.basic_salary.toLocaleString()}</TableCell>
                        <TableCell className="text-sm">{sal.gross_salary.toLocaleString()}</TableCell>
                        <TableCell className="font-medium text-sm">{sal.net_salary.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={sal.status === "processed" ? "bg-emerald-100 text-emerald-700 text-xs" : "bg-amber-100 text-amber-700 text-xs"}>{sal.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </CardContent></Card>
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 mt-auto"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"><p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} School Manager</p></div></footer>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  const iconBg: Record<string, string> = { emerald: "bg-emerald-100 text-emerald-600", blue: "bg-blue-100 text-blue-600", amber: "bg-amber-100 text-amber-600", purple: "bg-purple-100 text-purple-600" };
  return (<Card className="border-slate-200/60"><CardContent className="p-4"><div className={`w-8 h-8 rounded-lg ${iconBg[color]} flex items-center justify-center mb-2`}><Icon className="w-4 h-4" /></div><p className="text-xl font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500">{label}</p></CardContent></Card>);
}
