"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BookMarked,
  Upload,
  Download,
  FileText,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
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

// ─── Types ───────────────────────────────────────────────────
interface ClassItem {
  class_id: number;
  name: string;
}

interface SubjectItem {
  subject_id: number;
  name: string;
}

interface SyllabusItem {
  id: number;
  title: string;
  description: string;
  class_id: number;
  subject_id: number;
  file_url: string;
  class: { name: string };
  subject: { name: string };
  created_at: string;
}

// ─── Main Component ──────────────────────────────────────────
export default function TeacherSyllabusPage() {
  const { isLoading: authLoading } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [syllabi, setSyllabi] = useState<SyllabusItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Upload form
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadClassId, setUploadClassId] = useState("");
  const [uploadSubjectId, setUploadSubjectId] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // ─── Fetch data ────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [classesRes, subjectsRes, syllabusRes] = await Promise.all([
        fetch("/api/classes"),
        fetch("/api/subjects?limit=100"),
        fetch("/api/syllabus"),
      ]);
      if (classesRes.ok) { const d = await classesRes.json(); setClasses(d || []); }
      if (subjectsRes.ok) { const d = await subjectsRes.json(); setSubjects(Array.isArray(d) ? d : []); }
      if (syllabusRes.ok) { const d = await syllabusRes.json(); setSyllabi(Array.isArray(d) ? d : []); }
    } catch {
      setError("Failed to load syllabus data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) fetchData();
  }, [authLoading, fetchData]);

  // ─── Upload handler ────────────────────────────────────────
  const handleUpload = async () => {
    if (!uploadTitle || !uploadClassId || !uploadSubjectId) return;
    setIsUploading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const formData = new FormData();
      formData.append("title", uploadTitle);
      formData.append("description", uploadDesc);
      formData.append("class_id", uploadClassId);
      formData.append("subject_id", uploadSubjectId);
      if (uploadFile) formData.append("file", uploadFile);

      const res = await fetch("/api/syllabus", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload");
      setSuccessMsg("Syllabus uploaded successfully");
      setUploadOpen(false);
      setUploadTitle("");
      setUploadDesc("");
      setUploadFile(null);
      fetchData();
    } catch {
      setError("Failed to upload syllabus");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Syllabus</h1>
            <p className="text-sm text-slate-500 mt-1">Upload and manage syllabus documents</p>
          </div>
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]">
                <Upload className="w-4 h-4 mr-2" />
                Upload Syllabus
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Upload Syllabus</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
                    <AlertTriangle className="w-4 h-4" />{error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Syllabus title" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)} placeholder="Brief description" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Select value={uploadClassId} onValueChange={setUploadClassId}>
                      <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select value={uploadSubjectId} onValueChange={setUploadSubjectId}>
                      <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                      <SelectContent>
                        {subjects.map((s) => <SelectItem key={s.subject_id} value={String(s.subject_id)}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>File (optional)</Label>
                  <Input type="file" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} accept=".pdf,.doc,.docx,.txt" />
                </div>
                <Button onClick={handleUpload} disabled={isUploading || !uploadTitle || !uploadClassId || !uploadSubjectId} className="w-full bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                  {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  Upload
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

        {/* ─── Syllabus List ───────────────────────────────── */}
        <Card className="gap-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <BookMarked className="w-4 h-4 text-emerald-600" />
              </div>
              <CardTitle className="text-base font-semibold">Syllabus Documents ({syllabi.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {syllabi.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No syllabus uploaded yet</p>
                <p className="text-slate-300 text-xs mt-1">Click &quot;Upload Syllabus&quot; to add one</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Title</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Class</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Subject</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syllabi.map((s) => (
                      <TableRow key={s.id} className="hover:bg-slate-50">
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm text-slate-900">{s.title}</p>
                            {s.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{s.description}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="text-xs">{s.class?.name || "—"}</Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500">{s.subject?.name || "—"}</TableCell>
                        <TableCell className="text-right">
                          {s.file_url && (
                            <Button variant="ghost" size="sm" asChild className="min-w-[44px] min-h-[44px]">
                              <a href={s.file_url} target="_blank" rel="noopener noreferrer">
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
