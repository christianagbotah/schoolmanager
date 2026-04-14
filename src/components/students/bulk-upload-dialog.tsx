'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Upload,
  Download,
  FileSpreadsheet,
  X,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ParsedRow {
  first_name: string;
  middle_name: string;
  last_name: string;
  sex: string;
  birthday: string;
  religion: string;
  blood_group: string;
  nationality: string;
  phone: string;
  email: string;
  address: string;
}

interface ImportResult {
  row: number;
  student_code: string;
  success: boolean;
  error?: string;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length < 3) continue;

    const row: ParsedRow = {
      first_name: '',
      middle_name: '',
      last_name: '',
      sex: '',
      birthday: '',
      religion: '',
      blood_group: '',
      nationality: '',
      phone: '',
      email: '',
      address: '',
    };

    headers.forEach((header, idx) => {
      const value = values[idx] || '';
      if (header.includes('first_name') || header === 'firstname') row.first_name = value;
      else if (header.includes('middle_name') || header === 'middlename') row.middle_name = value;
      else if (header.includes('last_name') || header === 'lastname') row.last_name = value;
      else if (header === 'sex' || header === 'gender') row.sex = value;
      else if (header === 'birthday' || header === 'date_of_birth' || header === 'dob') row.birthday = value;
      else if (header === 'religion') row.religion = value;
      else if (header.includes('blood')) row.blood_group = value;
      else if (header === 'nationality') row.nationality = value;
      else if (header === 'phone') row.phone = value;
      else if (header === 'email') row.email = value;
      else if (header === 'address') row.address = value;
    });

    if (row.first_name || row.last_name) {
      rows.push(row);
    }
  }

  return rows;
}

function downloadTemplate() {
  const headers = 'first_name,middle_name,last_name,sex,birthday,religion,blood_group,nationality,phone,email,address';
  const example = 'John,Michael,Doe,Male,2010-05-15,Christian,A+,Ghanaian,0241234567,john.doe@email.com,123 Main Street';
  const example2 = 'Jane,,Smith,Female,2011-03-22,Islam,O+,Ghanaian,0209876543,jane.smith@email.com,456 Oak Avenue';
  const csv = `${headers}\n${example}\n${example2}`;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'student_upload_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function BulkUploadDialog({ open, onOpenChange, onSuccess }: BulkUploadDialogProps) {
  const [dragActive, setDragActive] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [phase, setPhase] = useState<'upload' | 'preview' | 'importing' | 'done'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length === 0) {
        return;
      }
      setParsedData(rows);
      setPhase('preview');
    };
    reader.readAsText(file);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  const handleImport = async () => {
    setPhase('importing');
    setImporting(true);
    setProgress(0);

    try {
      const res = await fetch('/api/students/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: parsedData }),
      });

      const data = await res.json();
      setResults(data.results || []);
      setProgress(100);
      setPhase('done');
      if (data.successCount > 0) {
        onSuccess();
      }
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setParsedData([]);
    setFileName('');
    setResults([]);
    setProgress(0);
    setPhase('upload');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[calc(100%-1rem)] sm:max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>Bulk Student Upload</DialogTitle>
          <DialogDescription>
            Upload multiple students at once using a CSV file.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 px-6 py-4 overflow-hidden">
          {/* Upload Phase */}
          {phase === 'upload' && (
            <div className="space-y-4">
              <div
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-colors cursor-pointer',
                  dragActive
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-10 w-10 text-slate-400 mb-4" />
                <p className="text-sm font-medium text-slate-700">
                  Drag & drop your CSV file here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports .csv files only
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Need a template? Download the CSV template below.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  className="gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Template
                </Button>
              </div>
            </div>
          )}

          {/* Preview Phase */}
          {phase === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium">{fileName}</span>
                  <Badge variant="secondary" className="text-xs">
                    {parsedData.length} students
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={reset} className="gap-1">
                  <X className="h-3.5 w-3.5" />
                  Change File
                </Button>
              </div>

              <ScrollArea className="max-h-[40vh] border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">#</th>
                      <th className="px-3 py-2 text-left font-medium">First Name</th>
                      <th className="px-3 py-2 text-left font-medium hidden sm:table-cell">Middle</th>
                      <th className="px-3 py-2 text-left font-medium">Last Name</th>
                      <th className="px-3 py-2 text-left font-medium hidden md:table-cell">Gender</th>
                      <th className="px-3 py-2 text-left font-medium hidden md:table-cell">Birthday</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((row, idx) => (
                      <tr key={idx} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                        <td className="px-3 py-2 font-medium">{row.first_name || '-'}</td>
                        <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">
                          {row.middle_name || '-'}
                        </td>
                        <td className="px-3 py-2">{row.last_name || '-'}</td>
                        <td className="px-3 py-2 hidden md:table-cell">{row.sex || '-'}</td>
                        <td className="px-3 py-2 text-muted-foreground hidden md:table-cell">
                          {row.birthday || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          )}

          {/* Importing Phase */}
          {phase === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <Loader2 className="h-12 w-12 text-emerald-600 animate-spin" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Importing Students...</p>
                <p className="text-sm text-muted-foreground">
                  Processing {parsedData.length} students
                </p>
              </div>
              <Progress value={progress} className="w-64" />
            </div>
          )}

          {/* Done Phase */}
          {phase === 'done' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-lg">
                <Check className="h-8 w-8 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-emerald-800">Import Complete</p>
                  <p className="text-sm text-emerald-600">
                    {successCount} student{successCount !== 1 ? 's' : ''} imported successfully
                    {failCount > 0 && `, ${failCount} failed`}
                  </p>
                </div>
              </div>

              {failCount > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    Failed Rows ({failCount})
                  </div>
                  <ScrollArea className="max-h-40 border rounded-lg">
                    <div className="p-2">
                      {results
                        .filter(r => !r.success)
                        .map(r => (
                          <div
                            key={r.row}
                            className="flex items-center justify-between px-2 py-1.5 text-sm border-b last:border-0"
                          >
                            <span>Row {r.row}</span>
                            <span className="text-red-500 text-xs">{r.error}</span>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {successCount > 0 && (
                <ScrollArea className="max-h-40 border rounded-lg">
                  <div className="p-2">
                    {results
                      .filter(r => r.success)
                      .map(r => (
                        <div
                          key={r.row}
                          className="flex items-center justify-between px-2 py-1.5 text-sm border-b last:border-0"
                        >
                          <span>Row {r.row}</span>
                          <Badge variant="outline" className="text-xs font-mono">
                            {r.student_code}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-2">
          {phase === 'preview' && (
            <Button
              onClick={handleImport}
              disabled={parsedData.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import {parsedData.length} Students
            </Button>
          )}
          {phase === 'done' && (
            <Button
              onClick={handleClose}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Done
            </Button>
          )}
          {phase === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
