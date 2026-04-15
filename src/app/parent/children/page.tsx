"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap, Users, Search, Eye, Loader2, AlertTriangle,
  ClipboardCheck, Receipt, Award, CalendarDays,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

interface EnrollInfo {
  class_id: number; section_id: number; year: string; term: string; mute: number;
  class: { class_id: number; name: string; name_numeric: number; category: string };
  section: { section_id: number; name: string };
}

interface Child {
  student_id: number; student_code: string; name: string; first_name: string; middle_name: string;
  last_name: string; sex: string; birthday: string | null; email: string; phone: string;
  address: string; mute: number; active_status: number; enrolls: EnrollInfo[];
}

export default function ParentChildrenPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isParent } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [year, setYear] = useState("");
  const [term, setTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  const fetchChildren = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/parent/children");
      if (res.ok) {
        const data = await res.json();
        setChildren(data.children || []);
        setYear(data.year || "");
        setTerm(data.term || "");
      }
    } catch { setError("Failed to load children"); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { if (!authLoading && isParent) fetchChildren(); }, [authLoading, isParent, fetchChildren]);

  const filtered = children.filter((c) => {
    const q = search.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.student_code?.toLowerCase().includes(q) || `${c.first_name} ${c.last_name}`.toLowerCase().includes(q);
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-12 w-full" /><div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Children</h1>
            <p className="text-sm text-slate-500 mt-1">View your children&apos;s profiles and academic details</p>
          </div>
          {year && <Badge variant="outline" className="text-xs">{year} — Term {term}</Badge>}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search by name or code..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"><AlertTriangle className="w-5 h-5" />{error}</div>
        )}

        {/* Children Grid */}
        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><GraduationCap className="w-4 h-4 text-emerald-600" /></div>
              <CardTitle className="text-base font-semibold">Children ({filtered.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {filtered.length === 0 ? (
              <div className="text-center py-12"><GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No children found</p></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((child) => {
                  const enroll = child.enrolls?.[0];
                  const isActive = child.mute === 0;
                  return (
                    <Card key={child.student_id} className={`gap-0 hover:shadow-md transition-shadow cursor-pointer ${!isActive ? "opacity-60" : ""}`} onClick={() => setSelectedChild(child)}>
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isActive ? "bg-gradient-to-br from-emerald-400 to-teal-500" : "bg-slate-300"}`}>
                            <span className="text-white font-bold text-lg">{(child.first_name || child.name || "S").charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900 truncate">{child.name || `${child.first_name} ${child.last_name}`.trim()}</p>
                            {enroll && <Badge variant="outline" className="text-xs mt-1">{enroll.class.name} {enroll.class.name_numeric} — {enroll.section.name}</Badge>}
                          </div>
                          <Button variant="ghost" size="sm" className="min-w-[44px] min-h-[44px]"><Eye className="w-4 h-4" /></Button>
                        </div>
                        <div className="flex items-center gap-3 mt-3 text-xs">
                          <Badge variant="secondary" className="font-mono text-xs">{child.student_code}</Badge>
                          <Badge variant="secondary" className="capitalize text-xs">{child.sex || "—"}</Badge>
                          <Badge variant={isActive ? "default" : "secondary"} className={`text-xs ${isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{isActive ? "Active" : "Inactive"}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={!!selectedChild} onOpenChange={(open) => !open && setSelectedChild(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Child Profile</DialogTitle></DialogHeader>
            {selectedChild && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${selectedChild.mute === 0 ? "bg-gradient-to-br from-emerald-400 to-teal-500" : "bg-slate-300"}`}>
                    <span className="text-white font-bold text-2xl">{(selectedChild.first_name || selectedChild.name || "S").charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{selectedChild.name || `${selectedChild.first_name} ${selectedChild.last_name}`.trim()}</h3>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="font-mono text-xs">{selectedChild.student_code}</Badge>
                      {selectedChild.enrolls?.[0] && <Badge variant="secondary" className="text-xs">{selectedChild.enrolls[0].class.name} {selectedChild.enrolls[0].class.name_numeric} — {selectedChild.enrolls[0].section.name}</Badge>}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-slate-400 text-xs uppercase">Date of Birth</p><p className="font-medium">{selectedChild.birthday ? format(new Date(selectedChild.birthday), "MMM d, yyyy") : "—"}</p></div>
                  <div><p className="text-slate-400 text-xs uppercase">Gender</p><p className="font-medium capitalize">{selectedChild.sex || "—"}</p></div>
                  <div><p className="text-slate-400 text-xs uppercase">Email</p><p className="font-medium">{selectedChild.email || "—"}</p></div>
                  <div><p className="text-slate-400 text-xs uppercase">Phone</p><p className="font-medium">{selectedChild.phone || "—"}</p></div>
                  <div className="col-span-2"><p className="text-slate-400 text-xs uppercase">Address</p><p className="font-medium">{selectedChild.address || "—"}</p></div>
                </div>
                {/* Quick Action Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { icon: ClipboardCheck, label: "Attendance", href: "/parent/attendance" },
                    { icon: Award, label: "Results", href: "/parent/results" },
                    { icon: Receipt, label: "Payments", href: "/parent/payments" },
                    { icon: CalendarDays, label: "Timetable", href: "/parent/routine" },
                  ].map((item) => (
                    <Button key={item.href} variant="outline" size="sm" className="h-auto py-3 flex flex-col items-center gap-1.5 text-xs" onClick={() => { setSelectedChild(null); router.push(item.href); }}>
                      <item.icon className="w-4 h-4" />{item.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
