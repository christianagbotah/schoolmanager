"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileClock,
  Upload,
  Download,
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle,
  FileText,
  Filter,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface ClassItem { class_id: number; name: string; }
interface SubjectItem { subject_id: number; name: string; }

interface MaterialItem {
  id: number;
  title: string;
  description: string;
  class_id: number;
  subject_id: number;
  file_url: string;
  file_type: string;
  class: { name: string };
  subject: { name: string };
  created_at: string;
  downloads: number;
}

// ─── Main Component ──────────────────────────────────────────
export default function TeacherStudyMaterialPage() {
  const { isLoading: authLoading } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  // Upload
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadClassId, setUploadClassId] = useState("");
  const [uploadSubjectId, setUploadSubjectId] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [classesRes, subjectsRes, materialsRes] = await Promise.all([
        fetch("/api/classes"),
        fetch("/api/subjects?limit=100"),
        fetch("/api/study-material"),
      ]);
      if (classesRes.ok) { const d = await classesRes.json(); setClasses(d || []); }
      if (subjectsRes.ok) { const d = await subjectsRes.json(); setSubjects(Array.isArray(d) ? d : []); }
      if (materialsRes.ok) { const d = await materialsRes.json(); setMaterials(Array.isArray(d) ? d : []); }
    } catch {
      setError("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) fetchData();
  }, [authLoading, fetchData]);

  const handleUpload = async () => {
    if (!uploadTitle || !uploadClassId || !uploadSubjectId || !uploadFile) return;
    setIsUploading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const formData = new FormData();
      formData.append("title", uploadTitle);
      formData.append("description", uploadDesc);
      formData.append("class_id", uploadClassId);
      formData.append("subject_id", uploadSubjectId);
      formData.append("file", uploadFile);

      const res = await fetch("/api/study-material", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to upload");
      setSuccessMsg("Study material uploaded successfully");
      setUploadOpen(false);
      setUploadTitle(""); setUploadDesc(""); setUploadFile(null);
      fetchData();
    } catch {
      setError("Failed to upload material");
    } finally {
      setIsUploading(false);
    }
  };

  const filteredMaterials = materials.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch = m.title?.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q);
    const matchClass = !filterClass || String(m.class_id) === filterClass;
    const matchSubject = !filterSubject || String(m.subject_id) === filterSubject;
    return matchSearch && matchClass && matchSubject;
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-full" />
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Study Materials</h1>
            <p className="text-sm text-slate-500 mt-1">Upload and share documents with students</p>
          </div>
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]">
                <Upload className="w-4 h-4 mr-2" />Upload Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Upload Study Material</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Material title" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)} rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Select value={uploadClassId} onValueChange={setUploadClassId}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{classes.map((c) => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select value={uploadSubjectId} onValueChange={setUploadSubjectId}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{subjects.map((s) => <SelectItem key={s.subject_id} value={String(s.subject_id)}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>File</Label>
                  <Input type="file" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt" />
                </div>
                <Button onClick={handleUpload} disabled={isUploading || !uploadTitle || !uploadClassId || !uploadSubjectId || !uploadFile} className="w-full bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                  {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}Upload
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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

        {/* ─── Filters ─────────────────────────────────────── */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search materials..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
                <SelectContent>{classes.map((c) => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger><SelectValue placeholder="All Subjects" /></SelectTrigger>
                <SelectContent>{subjects.map((s) => <SelectItem key={s.subject_id} value={String(s.subject_id)}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ─── Materials List ──────────────────────────────── */}
        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <FileClock className="w-4 h-4 text-purple-600" />
              </div>
              <CardTitle className="text-base font-semibold">Materials ({filteredMaterials.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {filteredMaterials.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No study materials found</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Title</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Class</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Subject</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden lg:table-cell">Downloads</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaterials.map((m) => (
                      <TableRow key={m.id} className="hover:bg-slate-50">
                        <TableCell>
                          <p className="font-medium text-sm text-slate-900">{m.title}</p>
                          {m.description && <p className="text-xs text-slate-400 line-clamp-1">{m.description}</p>}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell"><Badge variant="outline" className="text-xs">{m.class?.name || "—"}</Badge></TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-slate-500">{m.subject?.name || "—"}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-slate-500">{m.downloads || 0}</TableCell>
                        <TableCell className="text-right">
                          {m.file_url && (
                            <Button variant="ghost" size="sm" asChild className="min-w-[44px] min-h-[44px]">
                              <a href={m.file_url} target="_blank" rel="noopener noreferrer"><Download className="w-4 h-4 mr-1" />Download</a>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
