'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Upload, Download, FileSpreadsheet, ArrowLeft, CheckCircle,
  XCircle, Loader2, Info, Users, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

const CLASS_GROUPS = ['CRECHE', 'NURSERY', 'KG', 'BASIC', 'JHS'];

interface ClassItem { class_id: number; name: string; name_numeric: number; category: string; }
interface SectionItem { section_id: number; name: string; }

export default function BulkUploadPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    imported: number;
    errors: number;
    total: number;
    errorDetails: { row: number; error: string }[];
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fetch('/api/admin/classes?limit=200')
      .then(r => r.json())
      .then(d => setClasses(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClassId) {
      setSections([]);
      return;
    }
    fetch(`/api/admin/sections?class_id=${selectedClassId}`)
      .then(r => r.json())
      .then(d => setSections(Array.isArray(d) ? d : []))
      .catch(() => setSections([]));
  }, [selectedClassId]);

  const selectedClass = classes.find(c => String(c.class_id) === selectedClassId);

  const downloadTemplate = async () => {
    if (!selectedClassId || !selectedSectionId) {
      toast.error('Select class and section first');
      return;
    }
    try {
      const res = await fetch(`/api/admin/students/bulk?class_id=${selectedClassId}&section_id=${selectedSectionId}`);
      if (!res.ok) throw new Error('Failed to generate template');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `student_template_${selectedClass?.name || 'class'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Template downloaded successfully');
      setStep(3);
    } catch {
      toast.error('Failed to generate template');
    }
  };

  const handleFileSelect = (f: File) => {
    if (!f.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }
    setFile(f);
    setImportResults(null);
    parseCSV(f);
  };

  const parseCSV = async (f: File) => {
    setPreviewLoading(true);
    try {
      const text = await f.text();
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        toast.error('CSV file is empty');
        setPreviewLoading(false);
        return;
      }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      const rows = lines.slice(1, 51).map((line, i) => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((h, j) => { row[h] = values[j] || ''; });
        return { row: i + 2, ...row };
      });
      setPreview(rows);
      setStep(4);
      toast.success(`Preview loaded: ${rows.length} rows`);
    } catch {
      toast.error('Failed to parse CSV');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    if (!selectedClassId || !selectedSectionId) {
      toast.error('Class and section required');
      return;
    }
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('class_id', selectedClassId);
      formData.append('section_id', selectedSectionId);

      const res = await fetch('/api/admin/students/bulk', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setImportResults({
        imported: data.imported || 0,
        errors: data.errors || 0,
        total: data.total || 0,
        errorDetails: data.errorDetails || [],
      });
      toast.success(`Successfully imported ${data.imported || 0} student(s)`);
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
      setImportResults({ imported: 0, errors: 1, total: 0, errorDetails: [{ row: 0, error: err.message }] });
    } finally {
      setImporting(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview([]);
    setImportResults(null);
    setStep(3);
  };

  const stepLabels = ['Select Class', 'Generate Template', 'Fill Data', 'Upload & Import'];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/students"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bulk Student Admission</h1>
            <p className="text-sm text-slate-500 mt-1">Import multiple students at once using CSV file</p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 bg-white rounded-xl p-4 shadow-sm border">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                step > i + 1 ? 'bg-emerald-600 text-white' : step === i + 1 ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {step > i + 1 ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${step === i + 1 ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>{label}</span>
              {i < 3 && <ChevronRight className="w-4 h-4 text-slate-300 hidden sm:block" />}
            </div>
          ))}
        </div>

        {/* Step 1: Class & Section Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* How It Works */}
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-violet-600" />
                How It Works
              </h3>
              <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
                <li>Select the class and section</li>
                <li>Click &quot;Generate CSV Template&quot;</li>
                <li>Fill in student details in the file</li>
                <li>Dates must be in <strong>YYYY-MM-DD</strong> format</li>
                <li>Save file in CSV format</li>
                <li>Upload the completed file</li>
              </ol>
              <div className="mt-4 p-3 bg-amber-50 border-l-3 border-l-amber-400 rounded-r-lg text-xs text-amber-800">
                <strong>Important:</strong> Each student and parent must have a unique email address.
              </div>
            </CardContent>
          </Card>

          {/* Class Selection */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-600" />
                Step 1: Select Class & Section
              </h3>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-slate-500">Class *</Label>
                  <Select value={selectedClassId} onValueChange={v => { setSelectedClassId(v); setSelectedSectionId(''); setStep(2); }}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a class..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASS_GROUPS.map(g => (
                        <div key={g}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase bg-slate-50">{g}</div>
                          {classes.filter(c => c.category === g).sort((a, b) => a.name_numeric - b.name_numeric).map(c => (
                            <SelectItem key={c.class_id} value={String(c.class_id)}>
                              {c.name} {c.name_numeric}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-slate-500">Section *</Label>
                  <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={selectedClassId ? 'Select section...' : 'Select class first...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map(s => (
                        <SelectItem key={s.section_id} value={String(s.section_id)}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Step 2: Generate Template */}
        {step >= 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-14 h-14 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Download className="w-7 h-7 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Step 2: Generate CSV Template</h3>
                  <p className="text-sm text-slate-500 mt-1">Download a CSV template customized for your selected class</p>
                </div>
                <Button
                  onClick={downloadTemplate}
                  disabled={!selectedClassId || !selectedSectionId}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Generate CSV Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-800">Step 3: Upload Completed CSV</h3>
                  <Alert className="mt-3 bg-sky-50 border-sky-200">
                    <Info className="h-3 w-3 text-sky-600" />
                    <AlertDescription className="text-sky-800 text-xs">
                      Birthday must be in format <strong>YYYY-MM-DD</strong> (e.g., 2005-05-25)
                    </AlertDescription>
                  </Alert>
                </div>

                {/* File Drop Zone */}
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                    dragOver ? 'border-violet-500 bg-violet-50' : 'border-slate-300 hover:border-violet-400'
                  } ${file ? 'border-emerald-400 bg-emerald-50' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]); }}
                  onClick={() => document.getElementById('csv-file-input')?.click()}
                >
                  <input
                    id="csv-file-input"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }}
                  />
                  <Upload className={`w-8 h-8 mx-auto mb-2 ${file ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <p className="text-sm font-medium text-slate-700">
                    {file ? file.name : 'Click to select CSV file'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Only CSV files are accepted'}
                  </p>
                </div>

                {file && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={clearFile} className="flex-1">
                      <XCircle className="w-3 h-3 mr-1" /> Remove
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleImport}
                      disabled={importing || !selectedClassId || !selectedSectionId}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                      {importing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                      Import Students
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Preview Table */}
        {preview.length > 0 && step >= 4 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-violet-600" />
                Preview ({preview.length} rows)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {previewLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <div className="overflow-x-auto max-h-64">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs font-semibold">Row</TableHead>
                        <TableHead className="text-xs font-semibold">Name</TableHead>
                        <TableHead className="text-xs font-semibold">Sex</TableHead>
                        <TableHead className="text-xs font-semibold">Birthday</TableHead>
                        <TableHead className="text-xs font-semibold">Parent</TableHead>
                        <TableHead className="text-xs font-semibold">Phone</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs font-mono">{r.row}</TableCell>
                          <TableCell className="text-sm font-medium">{r.first_name} {r.last_name}</TableCell>
                          <TableCell className="text-sm capitalize">{r.sex}</TableCell>
                          <TableCell className="text-sm">{r.birthday || '—'}</TableCell>
                          <TableCell className="text-sm">{r.parent_name || '—'}</TableCell>
                          <TableCell className="text-sm">{r.parent_phone || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Import Results */}
        {importResults && (
          <Card className={importResults.errors > 0 && importResults.imported === 0 ? 'border-red-200' : 'border-emerald-200'}>
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Import Results</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="font-medium">{importResults.imported}</p>
                    <p className="text-xs text-slate-500">Imported</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="font-medium">{importResults.errors}</p>
                    <p className="text-xs text-slate-500">Errors</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-medium">{importResults.total}</p>
                    <p className="text-xs text-slate-500">Total Rows</p>
                  </div>
                </div>
              </div>
              {importResults.errorDetails.length > 0 && (
                <div className="max-h-48 overflow-y-auto bg-red-50 rounded-lg p-3">
                  {importResults.errorDetails.map((e, i) => (
                    <div key={i} className="text-sm text-red-700 py-1 flex gap-2">
                      <Badge variant="outline" className="text-[10px] shrink-0">Row {e.row}</Badge>
                      <span>{e.error}</span>
                    </div>
                  ))}
                </div>
              )}
              {importResults.imported > 0 && (
                <div className="mt-4 p-3 bg-emerald-50 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm text-emerald-800 font-medium">
                    {importResults.imported} student(s) admitted successfully to {selectedClass?.name}!
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Importing Overlay */}
        {importing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-80">
              <CardContent className="p-8 text-center space-y-4">
                <Loader2 className="w-10 h-10 text-violet-600 animate-spin mx-auto" />
                <h3 className="font-semibold text-slate-800">Importing Students</h3>
                <p className="text-sm text-slate-500">Please wait, do not close or refresh this page...</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
