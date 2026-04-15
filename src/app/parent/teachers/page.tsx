"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users, Search, Mail, Phone, Loader2, AlertTriangle, GraduationCap,
  UserCheck, BookOpen, ChevronDown, ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { useState as useReactState } from "react";

interface ClassMasterItem {
  teacher_id: number; name: string; email: string; phone: string; gender: string;
  class_id: number; class_name: string; class_name_numeric: number;
  class_section: string; student_name: string; student_id: number;
}

interface SubjectTeacherItem {
  teacher_id: number; name: string; email: string; phone: string; gender: string;
  subject_name: string; class_name: string; class_name_numeric: number;
  student_name: string; student_id: number;
}

export default function ParentTeachersPage() {
  const { isLoading: authLoading, isParent } = useAuth();
  const [classMasters, setClassMasters] = useState<ClassMasterItem[]>([]);
  const [subjectTeachers, setSubjectTeachers] = useState<SubjectTeacherItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useReactState("class-masters");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/parent/teachers");
      if (res.ok) {
        const d = await res.json();
        setClassMasters(d.classMasters || []);
        setSubjectTeachers(d.subjectTeachers || []);
      }
    } catch { setError("Failed to load teachers"); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { if (!authLoading && isParent) fetchData(); }, [authLoading, isParent, fetchData]);

  const filteredMasters = classMasters.filter((t) => {
    const q = search.toLowerCase();
    return t.name?.toLowerCase().includes(q) || t.class_name?.toLowerCase().includes(q) || t.student_name?.toLowerCase().includes(q);
  });

  const filteredSubjects = subjectTeachers.filter((t) => {
    const q = search.toLowerCase();
    return t.name?.toLowerCase().includes(q) || t.subject_name?.toLowerCase().includes(q) || t.student_name?.toLowerCase().includes(q);
  });

  // Group subject teachers by student
  const subjectsByStudent = new Map<string, SubjectTeacherItem[]>();
  for (const t of filteredSubjects) {
    const key = `${t.student_id}-${t.student_name}`;
    if (!subjectsByStudent.has(key)) subjectsByStudent.set(key, []);
    subjectsByStudent.get(key)!.push(t);
  }

  const TeacherAvatar = ({ name, gender }: { name: string; gender: string }) => (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${gender?.toLowerCase() === "female" ? "bg-pink-100" : "bg-emerald-100"}`}>
      <span className={`font-bold text-sm ${gender?.toLowerCase() === "female" ? "text-pink-600" : "text-emerald-600"}`}>{name?.charAt(0)?.toUpperCase() || "?"}</span>
    </div>
  );

  if (isLoading) {
    return <DashboardLayout><div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-12 w-full" /><div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Teachers</h1><p className="text-sm text-slate-500 mt-1">Class masters and subject teachers for your children</p></div>

        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search teachers, subjects, or classes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>

        {error && <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"><AlertTriangle className="w-5 h-5" />{error}</div>}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="class-masters" className="gap-1.5"><UserCheck className="w-4 h-4" />Class Masters ({classMasters.length})</TabsTrigger>
            <TabsTrigger value="subject-teachers" className="gap-1.5"><BookOpen className="w-4 h-4" />Subject Teachers ({subjectTeachers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="class-masters" className="mt-4">
            <Card className="gap-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><UserCheck className="w-4 h-4 text-emerald-600" /></div>
                  <CardTitle className="text-base font-semibold">Class Masters ({filteredMasters.length})</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {filteredMasters.length === 0 ? (
                  <div className="text-center py-12"><GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No class masters found</p></div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredMasters.map((t, idx) => (
                      <div key={`${t.teacher_id}-${idx}`} className="p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <TeacherAvatar name={t.name} gender={t.gender} />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-slate-900">{t.name}</p>
                            <p className="text-xs text-slate-500">{t.class_name} {t.class_name_numeric} {t.class_section && `— ${t.class_section}`}</p>
                            <p className="text-[10px] text-slate-400">Child: {t.student_name}</p>
                          </div>
                          <div className="text-right hidden sm:block">
                            {t.email && <a href={`mailto:${t.email}`} className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1 ml-auto"><Mail className="w-3 h-3" />{t.email}</a>}
                            {t.phone && <p className="text-xs text-slate-500 mt-0.5"><Phone className="w-3 h-3 inline mr-1" />{t.phone}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subject-teachers" className="mt-4">
            <Card className="gap-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center"><BookOpen className="w-4 h-4 text-violet-600" /></div>
                  <CardTitle className="text-base font-semibold">Subject Teachers ({filteredSubjects.length})</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {filteredSubjects.length === 0 ? (
                  <div className="text-center py-12"><GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No subject teachers found</p></div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {Array.from(subjectsByStudent.entries()).map(([key, teachers]) => {
                      const studentName = teachers[0]?.student_name || "Unknown";
                      const studentId = key.split("-")[0];
                      return (
                        <div key={key}>
                          <div className="flex items-center gap-2 mb-2">
                            <ChevronRight className="w-4 h-4 text-emerald-600" />
                            <h4 className="text-sm font-semibold text-slate-900">{studentName}</h4>
                            <Badge variant="secondary" className="text-[10px]">{teachers.length} teacher{teachers.length > 1 ? "s" : ""}</Badge>
                          </div>
                          <div className="ml-6 space-y-2">
                            {teachers.map((t, idx) => (
                              <div key={`${t.teacher_id}-${t.subject_name}-${idx}`} className="p-3 rounded-lg border border-slate-100 bg-white">
                                <div className="flex items-center gap-3">
                                  <TeacherAvatar name={t.name} gender={t.gender} />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-sm text-slate-900">{t.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <Badge variant="outline" className="text-[10px]">{t.subject_name}</Badge>
                                      <span className="text-[10px] text-slate-400">{t.class_name} {t.class_name_numeric}</span>
                                    </div>
                                  </div>
                                  <div className="text-right hidden sm:block">
                                    {t.email && <a href={`mailto:${t.email}`} className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1 ml-auto"><Mail className="w-3 h-3" />{t.email}</a>}
                                    {t.phone && <p className="text-xs text-slate-500 mt-0.5"><Phone className="w-3 h-3 inline mr-1" />{t.phone}</p>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
