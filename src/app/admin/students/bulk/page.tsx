'use client';

import { useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, Download, FileSpreadsheet, ArrowLeft, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

const CLASS_GROUPS = ['CRECHE', 'NURSERY', 'KG', 'BASIC', 'JHS'];

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; errors: { row: number; error: string }[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const downloadTemplate = () => {
    const headers = ['first_name', 'last_name', 'sex', 'birthday', 'religion', 'blood_group', 'nationality', 'phone', 'address', 'parent_name', 'parent_phone', 'class_name', 'section_name'];
    const sample = ['Kwame', 'Asante', 'male', '2015-03-15', 'Christian', 'A+', 'Ghanaian', '0240000000', 'Accra', 'Kofi Asante', '0240000001', 'Basic 1', 'A'];
    const csv = [headers.join(','), sample.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'student_upload_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (f: File) => {
    if (!f.name.endsWith('.csv')) { toast.error('Please upload a CSV file'); return; }
    setFile(f);
    setImportResults(null);
    parseCSV(f);
  };

  const parseCSV = async (f: File) => {
    setPreviewLoading(true);
    try {
      const text = await f.text();
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) { toast.error('CSV file is empty'); setPreviewLoading(false); return; }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      const rows = lines.slice(1, 51).map((line, i) => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((h, j) => { row[h] = values[j] || ''; });
        return { row: i + 2, ...row };
      });
      setPreview(rows);
      toast.success(`Preview loaded: ${rows.length} of ${lines.length - 1} rows`);
    } catch { toast.error('Failed to parse CSV'); } finally { setPreviewLoading(false); }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true); setImportProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/students/bulk', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setImportResults({ success: data.success || 0, errors: data.errors || [] });
      toast.success(`Imported ${data.success || 0} students successfully`);
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
      setImportResults({ success: 0, errors: [{ row: 0, error: err.message }] });
    } finally { setImporting(false); setImportProgress(100); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link href="/admin/students"><ArrowLeft className="w-5 h-5" /></Link></Button>
          <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bulk Student Upload</h1><p className="text-sm text-slate-500 mt-1">Import multiple students from a CSV file</p></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <div className={`border-2 border-dashed rounded-xl p-8 transition-colors ${dragOver ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400'}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]); }}>
                <Upload className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                <p className="text-sm text-slate-600 font-medium">Drag & Drop CSV file here</p>
                <p className="text-xs text-slate-400">or click to browse</p>
                <input type="file" accept=".csv" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }} />
              </div>
              {file && <Badge variant="outline" className="text-xs"><FileSpreadsheet className="w-3 h-3 mr-1" />{file.name} ({(file.size / 1024).toFixed(1)} KB)</Badge>}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-slate-800">Instructions</h3>
              <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
                <li>Download the CSV template below</li>
                <li>Fill in student data following the template format</li>
                <li>Upload the completed CSV file</li>
                <li>Preview the data and click Import</li>
              </ol>
              <Button variant="outline" onClick={downloadTemplate} className="w-full">
                <Download className="w-4 h-4 mr-2" />Download CSV Template
              </Button>
              <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
                <p className="font-medium mb-1">Required columns:</p>
                <p>first_name, last_name, sex, class_name</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {preview.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">Preview ({preview.length} rows)</h3>
                <Button onClick={handleImport} disabled={importing} className="bg-emerald-600 hover:bg-emerald-700">
                  {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  {importing ? 'Importing...' : 'Import Students'}
                </Button>
              </div>
              {importing && <Progress value={importProgress} className="mb-4" />}
              <div className="overflow-x-auto max-h-96">
                <Table>
                  <TableHeader><TableRow className="bg-slate-50">
                    <TableHead className="text-xs font-semibold">Row</TableHead>
                    <TableHead className="text-xs font-semibold">Name</TableHead>
                    <TableHead className="text-xs font-semibold">Sex</TableHead>
                    <TableHead className="text-xs font-semibold">Birthday</TableHead>
                    <TableHead className="text-xs font-semibold">Parent</TableHead>
                    <TableHead className="text-xs font-semibold">Class</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {preview.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs font-mono">{r.row}</TableCell>
                        <TableCell className="text-sm">{r.first_name} {r.last_name}</TableCell>
                        <TableCell className="text-sm capitalize">{r.sex}</TableCell>
                        <TableCell className="text-sm">{r.birthday}</TableCell>
                        <TableCell className="text-sm">{r.parent_name || '—'}</TableCell>
                        <TableCell className="text-sm">{r.class_name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {importResults && (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Import Results</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-600" /><span className="font-medium">{importResults.success} imported successfully</span></div>
                {importResults.errors.length > 0 && <div className="flex items-center gap-2"><XCircle className="w-5 h-5 text-red-500" /><span className="font-medium">{importResults.errors.length} errors</span></div>}
              </div>
              {importResults.errors.length > 0 && (
                <div className="max-h-48 overflow-y-auto bg-red-50 rounded-lg p-3">
                  {importResults.errors.map((e, i) => (
                    <div key={i} className="text-sm text-red-700 py-1"><span className="font-mono text-xs mr-2">Row {e.row}:</span>{e.error}</div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
