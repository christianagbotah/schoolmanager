"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  AlertTriangle, Loader2, FileText, Upload, Trash2, Search,
  File, X, Plus, Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";

// ─── Types ───────────────────────────────────────────────────
interface ClassItem {
  class_id: number;
  name: string;
  sections: { section_id: number; name: string }[];
}

interface ExamItem {
  exam_id: number;
  name: string;
}

interface QuestionPaper {
  question_paper_id: number;
  title: string;
  class_name: string;
  exam: { exam_id: number; name: string } | null;
  file_path: string;
  description: string;
  upload_date: string | null;
}

// ─── Main Component ──────────────────────────────────────────
export default function TeacherQuestionPapersPage() {
  const { isLoading: authLoading } = useAuth();
  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    class_id: "",
    exam_id: "",
    description: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // ─── Fetch data ───────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    try {
      const [papersRes, classesRes, examsRes] = await Promise.all([
        fetch("/api/teacher/question-papers"),
        fetch("/api/teacher/classes"),
        fetch("/api/teacher/exams"),
      ]);
      const papersData = await papersRes.json();
      setPapers(papersData.papers || []);
      const classesData = await classesRes.json();
      setClasses(classesData || []);
      if (examsRes.ok) {
        const examsData = await examsRes.json();
        setExams(examsData.exams || examsData || []);
      }
    } catch {
      setError("Failed to load data");
    }
    setLoading(false);
  }, [authLoading]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Upload ───────────────────────────────────────────────
  const handleUpload = async () => {
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    setUploading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      if (form.class_id) formData.append("class_id", form.class_id);
      if (form.exam_id) formData.append("exam_id", form.exam_id);
      if (selectedFile) formData.append("file", selectedFile);

      const res = await fetch("/api/teacher/question-papers", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      setSuccessMsg("Question paper uploaded successfully");
      setFormOpen(false);
      setForm({ title: "", class_id: "", exam_id: "", description: "" });
      setSelectedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload");
    }
    setUploading(false);
  };

  const filtered = search
    ? papers.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()))
    : papers;

  // ─── Loading ──────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[400px] w-full rounded-xl" />
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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Question Papers</h1>
            <p className="text-sm text-slate-500 mt-1">Upload and manage examination question papers</p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]">
            <Upload className="w-4 h-4 mr-2" /> Upload Paper
          </Button>
        </div>

        {/* ─── Stats ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-emerald-50 rounded-xl p-4 border">
            <p className="text-2xl font-bold text-emerald-600">{papers.length}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Total Papers</p>
          </div>
          <div className="bg-teal-50 rounded-xl p-4 border">
            <p className="text-2xl font-bold text-teal-600">{papers.filter((p) => p.file_path).length}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">With Files</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 border">
            <p className="text-2xl font-bold text-amber-600">{filtered.length}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Search Results</p>
          </div>
        </div>

        {/* ─── Messages ───────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            <FileText className="w-5 h-5 flex-shrink-0" />
            {successMsg}
          </div>
        )}

        {/* ─── Papers List ────────────────────────────────── */}
        <Card className="gap-4">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Uploaded Papers</CardTitle>
                <CardDescription>{filtered.length} paper{filtered.length !== 1 ? "s" : ""} found</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 w-48 min-h-[44px]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">No Papers Found</h3>
                <p className="text-sm text-slate-500 mb-4">Upload your first question paper</p>
                <Button onClick={() => setFormOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  <Upload className="w-4 h-4 mr-2" /> Upload Paper
                </Button>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="hidden sm:table-cell">Class</TableHead>
                      <TableHead className="hidden md:table-cell">Exam</TableHead>
                      <TableHead className="hidden md:table-cell">File</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((paper, idx) => (
                      <TableRow key={paper.question_paper_id} className="hover:bg-slate-50">
                        <TableCell className="text-sm text-slate-500">{idx + 1}</TableCell>
                        <TableCell className="font-semibold text-slate-900">{paper.title}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500">{paper.class_name || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="text-xs">{paper.exam?.name || "—"}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {paper.file_path ? (
                            <a href={paper.file_path} target="_blank" className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 text-sm">
                              <FileText className="w-4 h-4" />
                              <span>View</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 text-xs">No file</span>
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

        {/* ─── Upload Dialog ──────────────────────────────── */}
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" />
                Upload Question Paper
              </DialogTitle>
              <DialogDescription>Add a new question paper for an examination</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Mathematics Mid-Term 2024" className="min-h-[44px]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Class</Label>
                  <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v })}>
                    <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.class_id} value={String(c.class_id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Exam</Label>
                  <Select value={form.exam_id} onValueChange={(v) => setForm({ ...form, exam_id: v })}>
                    <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select exam" /></SelectTrigger>
                    <SelectContent>
                      {exams.map((e) => (
                        <SelectItem key={e.exam_id} value={String(e.exam_id)}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>File (PDF, DOC, DOCX)</Label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-emerald-400 transition-colors">
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <File className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-medium text-slate-700">{selectedFile.name}</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-slate-400" />
                      <span className="text-sm text-slate-500">Click to select file</span>
                      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                    </label>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description (optional)" rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button onClick={handleUpload} className="bg-emerald-600 hover:bg-emerald-700" disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
