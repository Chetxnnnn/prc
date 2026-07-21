"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, AlertCircle, CheckCircle2, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { bulkCreateStudents, type BulkStudentRow } from "@/actions/students";

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CSV_HEADERS = [
  "full_name",
  "email",
  "contact_number",
  "parent_name",
  "parent_contact",
  "board",
  "class_number",
  "subjects",
  "address",
  "school_name",
  "previous_academic_performance",
  "date_of_birth",
  "gender",
  "enrollment_date",
  "status",
  "monthly_fee",
];

const TEMPLATE_HEADERS = [
  "full_name",
  "email",
  "contact_number",
  "parent_name",
  "parent_contact",
  "board",
  "class_number",
  "subjects",
  "address",
  "school_name",
  "previous_academic_performance",
  "date_of_birth",
  "gender",
  "enrollment_date",
  "status",
  "monthly_fee",
];

function parseCSV(text: string): BulkStudentRow[] {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));

  return lines.slice(1).map((line) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    return row as unknown as BulkStudentRow;
  });
}

function downloadTemplate() {
  const header = TEMPLATE_HEADERS.join(",");
  const example = [
    "Rahul Kumar,rahul@example.com,9876543210,Suresh Kumar,9876543211,cbse,8,Mathematics Science English,123 Main St,Delhi Public School,85%,,,,",
    "Priya Singh,priya@example.com,9876543220,Anita Singh,9876543221,icse,7,Mathematics Science English Hindi,456 Park Ave,St Marys School,9.2 CGPA,2013-07-22,female,,active,2500",
  ].join("\n");

  const blob = new Blob([header + "\n" + example + "\n"], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "student_import_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function BulkUploadDialog({
  open,
  onOpenChange,
  onSuccess,
}: BulkUploadDialogProps) {
  const [step, setStep] = useState<"pick" | "preview" | "result">("pick");
  const [parsedRows, setParsedRows] = useState<BulkStudentRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: { row: number; name: string; error: string }[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length === 0) {
        toast.error("No data rows found in CSV");
        return;
      }
      setParsedRows(rows);
      setStep("preview");
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    setImporting(true);
    try {
      const res = await bulkCreateStudents(parsedRows);
      setResult(res);
      setStep("result");
      if (res.failed === 0) {
        toast.success(`${res.success} student${res.success !== 1 ? "s" : ""} imported`);
      } else {
        toast.warning(`${res.success} imported, ${res.failed} failed`);
      }
    } catch {
      toast.error("Import failed");
    } finally {
      setImporting(false);
    }
  }

  function handleClose() {
    setStep("pick");
    setParsedRows([]);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
    onOpenChange(false);
  }

  function handleDone() {
    handleClose();
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk add students</DialogTitle>
        </DialogHeader>

        {step === "pick" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload a CSV file with student details. Each row represents one student.
            </p>

            <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-3">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Choose a CSV file</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports .csv files with headers matching the template
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleFile}
                className="hidden"
                id="csv-upload"
              />
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                <FileText className="h-4 w-4 mr-2" />
                Select file
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-muted p-3">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Need a template?</span>
              </div>
              <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                Download CSV template
              </Button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">CSV columns (required first, optional last):</p>
              <p>full_name*, email*, contact_number*, parent_name*, parent_contact*, board*, class_number*, address, school_name, previous_academic_performance, date_of_birth, gender, subjects, enrollment_date, status, monthly_fee</p>
              <p className="mt-1">
                <strong>Required:</strong> full_name, email, contact_number, parent_name, parent_contact, board, class_number
              </p>
              <p>
                <strong>Optional (with defaults):</strong> date_of_birth = 2000-01-01, gender = male, subjects = General, enrollment_date = today, status = active, monthly_fee = 0
              </p>
              <p><strong>Subjects:</strong> comma or space separated (e.g., "Mathematics, Science, English" or "Mathematics Science English")</p>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Found <span className="font-medium text-foreground">{parsedRows.length}</span> student{parsedRows.length !== 1 ? "s" : ""} to import
              </p>
              <Button variant="ghost" size="sm" onClick={() => setStep("pick")}>
                <X className="h-3 w-3 mr-1" />
                Change file
              </Button>
            </div>

            <div className="border rounded-lg overflow-auto max-h-[40vh]">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground w-8">#</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Class</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Board</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Gender</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Contact</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Parent</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Subjects</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2 font-medium">{row.full_name || <span className="text-destructive">Missing</span>}</td>
                      <td className="px-3 py-2">{row.class_number || <span className="text-destructive">—</span>}</td>
                      <td className="px-3 py-2 uppercase">{row.board || <span className="text-destructive">—</span>}</td>
                      <td className="px-3 py-2 capitalize">{row.gender || <span className="text-destructive">—</span>}</td>
                      <td className="px-3 py-2">{row.contact_number || <span className="text-destructive">—</span>}</td>
                      <td className="px-3 py-2">{row.parent_name || <span className="text-destructive">—</span>}</td>
                      <td className="px-3 py-2">{row.subjects || <span className="text-destructive">—</span>}</td>
                      <td className="px-3 py-2 text-right">{row.monthly_fee || "0"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? "Importing..." : `Import ${parsedRows.length} student${parsedRows.length !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        )}

        {step === "result" && result && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {result.failed === 0 ? (
                <CheckCircle2 className="h-8 w-8 text-success" />
              ) : (
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              )}
              <div>
                <p className="font-medium">
                  {result.failed === 0
                    ? "All students imported successfully"
                    : "Import completed with errors"}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="inline-flex h-5 items-center rounded-full border border-transparent bg-primary/10 px-2 text-xs font-medium text-primary">
                    {result.success} imported
                  </span>
                  {result.failed > 0 && (
                    <Badge variant="destructive" className="ml-1">{result.failed} failed</Badge>
                  )}
                </p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="border rounded-lg overflow-auto max-h-[30vh]">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Row</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Student</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((err, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2 text-muted-foreground">{err.row}</td>
                        <td className="px-3 py-2 font-medium">{err.name}</td>
                        <td className="px-3 py-2 text-destructive">{err.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end gap-2">
              {result.failed > 0 && (
                <Button variant="outline" onClick={() => setStep("pick")}>
                  Try again
                </Button>
              )}
              <Button onClick={handleDone}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
