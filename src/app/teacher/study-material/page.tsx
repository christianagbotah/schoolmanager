"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileClock, Upload, Download, Search, Loader2, AlertTriangle,
  CheckCircle, FileText, BookOpen, GraduationCap, X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface SubjectItem {
  subject_id: number;
  name: string;
  class?: { class_id: number; name: string };
}

interface MaterialItem {
  id: number;
  title: string;
  description: string;
  file_url: string;
  file_type: string;
  upload_date: string;
  class?: { class_id: number; name: string };
  subject?: { subject_id: number; name: string };
  teacher?: { teacher_id: number; name: string };
}

// ─── Helpers ─────────────────────────────────────────────────
function getFileIcon(fileType: string) {
  if (fileType?.includes("pdf")) return "📄";
  if (fileType?.includes("word") || fileType?.includes("doc")) return "📝";
  if (fileType?.includes("sheet") || fileType?.includes("excel")) return "📊";
  if (fileType?.includes("presentation") || fileType?.includes("ppt")) return "📽️";
  return "📎";
}

function getFileBadgeColor(fileType: string): string {
  if (fileType?.includes("pdf")) return "bg-red-100 text-red-700";
  if (fileType?.includes("word") || fileType?.includes("doc")) return "bg-sky-100 text-sky-700";
  if (fileType?.includes("sheet") || fileType?.includes("excel")) return "bg-emerald-100 text-emerald-700";
  if (fileType?.includes("presentation") || fileType?.includes("ppt")) return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

// ─── Main Component ──────────────────────────────────────────
export default function TeacherStudyMaterialPage() {
  const { isLoading: authLoading } = useAuth();
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  // Upload
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadSubjectId, setUploadSubjectId] = useState("");
  const [uploadClassId, setUploadClassId] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [subjectsRes, materialsRes] = await Promise.all([
        fetch("/api/teacher/subjects"),
        fetch("/api/teacher/materials"),
      ]);
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
    if (!uploadTitle || !uploadFile) return;
    setIsUploading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const formData = new FormData();
      formData.append("title", uploadTitle);
      formData.append("description", uploadDesc);
      formData.append("subject_id", uploadSubjectId);
      formData.append("class_id", uploadClassId);
      formData.append("file", uploadFile);

      const res = await fetch("/api/study-material", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Upload failed");
      }

      setSuccessMsg("Study material uploaded successfully!");
      setUploadOpen(false);
      setUploadTitle("");
      setUploadDesc("");
      setUploadSubjectId("");
      setUploadClassId("");
      setUploadFile(null);
      fetchData(); // refresh list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload material");
    } finally {
      setIsUploading(false);
    }
  };

  const filteredMaterials = materials.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch = m.title?.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q);
    const matchSubject = !filterSubject || String(m.subject_id) === filterSubject;
    return matchSearch && matchSubject;
  });

  // Get unique class IDs from subjects
  const classMap = new Map<number, string>();
  subjects.forEach(s => {
    if (s.class?.class_id && s.class?.name && !classMap.has(s.class.class_id)) {
      classMap.set(s.class.class_id, s.class.name);
    }
  });
  const classOptions = Array.from(classMap.entries()).map(([id, name]) => ({ id, name }));

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
        {/* ─── Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Study Materials</h1>
            <p className="text-sm text-slate-500 mt-1">Upload and share documents with students</p>
          </div>
          <Dialog open={uploadOpen} onOpenChange={(open) => { setUploadOpen(open); if (!open) { setError(null); setSuccessMsg(null); } }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]">
                <Upload className="w-4 h-4 mr-2" />Upload Material
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Upload className="w-4 h-4 text-emerald-600" />
                  </div>
                  <DialogTitle>Upload Study Material</DialogTitle>
                </div>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                {successMsg && (
                  <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle className="w-4 h-4" />{successMsg}
                  </div>
                )}
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
                    <AlertTriangle className="w-4 h-4" />{error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Material title (e.g., Chapter 1 Notes)" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)} rows={2} placeholder="Brief description of the material..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Select value={uploadClassId} onValueChange={setUploadClassId}>
                      <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                      <SelectContent>
                        {classOptions.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select value={uploadSubjectId} onValueChange={setUploadSubjectId}>
                      <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                      <SelectContent>
                        {subjects.map((s) => (
                          <SelectItem key={s.subject_id} value={String(s.subject_id)}>
                            {s.name} {s.class?.name ? `(${s.class.name})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>File *</Label>
                  <div className="relative">
                    {uploadFile ? (
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50">
                        <span className="text-lg">{getFileIcon(uploadFile.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{uploadFile.name}</p>
                          <p className="text-xs text-slate-400">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setUploadFile(null)} className="min-w-[44px] min-h-[44px]">
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-24 rounded-lg border-2 border-dashed border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 cursor-pointer transition-colors">
                        <Upload className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-xs text-slate-500">Click to select a file</span>
                        <span className="text-[10px] text-slate-400">PDF, DOC, PPT, XLS up to 10MB</span>
                        <input
                          type="file"
                          onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                          className="hidden"
                        />
                      </label>
                    )}
                    {!uploadFile && (
                      <input
                        type="file"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                        className="hidden"
                        id="file-upload"
                      />
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || !uploadTitle || !uploadFile}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Material
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* ─── Success Message ─────────────────────────────── */}
        {successMsg && !uploadOpen && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />{successMsg}
            <Button variant="ghost" size="sm" className="ml-auto text-emerald-600" onClick={() => setSuccessMsg(null)}>
              Dismiss
            </Button>
          </div>
        )}

        {/* ─── Filters ─────────────────────────────────────── */}
        <Card className="gap-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search materials..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger><SelectValue placeholder="All Subjects" /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.subject_id} value={String(s.subject_id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ─── Materials List ──────────────────────────────── */}
        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <FileClock className="w-4 h-4 text-purple-600" />
                </div>
                <CardTitle className="text-base font-semibold">Materials ({filteredMaterials.length})</CardTitle>
              </div>
              {materials.length > 0 && (
                <Badge variant="outline" className="text-xs">{subjects.length} subjects</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {filteredMaterials.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600">No study materials found</h3>
                <p className="text-sm text-slate-400 mt-1">Upload your first study material to share with students</p>
                <Button
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setUploadOpen(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />Upload Material
                </Button>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Title</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Subject</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Class</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden lg:table-cell">Date</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaterials.map((m) => (
                      <TableRow key={m.id} className="hover:bg-slate-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 text-lg border border-purple-100">
                              {getFileIcon(m.file_type)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-slate-900 truncate">{m.title}</p>
                              {m.description && <p className="text-xs text-slate-400 line-clamp-1">{m.description}</p>}
                              {m.file_type && (
                                <Badge variant="secondary" className={`text-[10px] mt-1 ${getFileBadgeColor(m.file_type)}`}>
                                  {m.file_type.split("/").pop()?.toUpperCase()}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500">{m.subject?.name || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="text-xs">{m.class?.name || "—"}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-slate-400">
                          {m.upload_date ? format(new Date(m.upload_date), "MMM d, yyyy") : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {m.file_url && (
                            <Button variant="ghost" size="sm" asChild className="min-w-[44px] min-h-[44px]">
                              <a href={m.file_url} target="_blank" rel="noopener noreferrer">
                                <Download className="w-4 h-4" />
                              </a>
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
