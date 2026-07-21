"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { StudentTable } from "@/components/features/students/student-table";
import { StudentFormDialog } from "@/components/features/students/student-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Upload, X } from "lucide-react";
import { getStudents, getStudent } from "@/actions/students";
import { BulkUploadDialog } from "@/components/features/students/bulk-upload-dialog";
import type { Tables } from "@/types/database.types";

export default function StudentsPage() {
  return (
    <Suspense>
      <StudentsContent />
    </Suspense>
  );
}

function StudentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [students, setStudents] = useState<Tables<"students">[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [classFilter, setClassFilter] = useState(searchParams.get("class") ?? "");
  const [boardFilter, setBoardFilter] = useState(searchParams.get("board") ?? "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "");
  const [formOpen, setFormOpen] = useState(searchParams.get("action") === "new");
  const [editingStudent, setEditingStudent] = useState<Tables<"students"> | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const hasFilters = search || classFilter || boardFilter || statusFilter;

  async function loadStudents() {
    setLoading(true);
    try {
      const data = await getStudents({
        search: search || undefined,
        class_number: classFilter ? Number(classFilter) : undefined,
        board: boardFilter || undefined,
        status: statusFilter || undefined,
      });
      setStudents(data);
    } catch {
      console.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, [search, classFilter, boardFilter, statusFilter]);

  function clearFilters() {
    setSearch("");
    setClassFilter("");
    setBoardFilter("");
    setStatusFilter("");
  }

  return (
    <>
      <AppHeader
        title="Students"
        subtitle={`${students.length} student${students.length !== 1 ? "s" : ""}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setBulkOpen(true)} className="gap-2">
              <Upload className="h-4 w-4" />
              Upload CSV
            </Button>
            <Button onClick={() => setFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add student
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={classFilter} onValueChange={(v) => setClassFilter(v ?? "")}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((c) => (
                  <SelectItem key={c} value={String(c)}>
                    Class {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={boardFilter} onValueChange={(v) => setBoardFilter(v ?? "")}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Board" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cbse">CBSE</SelectItem>
                <SelectItem value="icse">ICSE</SelectItem>
                <SelectItem value="state">State</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "")}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="dropped">Dropped</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        </div>

        <StudentTable
          data={students}
          loading={loading}
          onEdit={async (student) => {
            const fresh = await getStudent(student.id);
            setEditingStudent(fresh);
            setFormOpen(true);
          }}
          onDelete={() => loadStudents()}
        />
      </div>

      <StudentFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditingStudent(null);
            router.replace("/students");
          }
        }}
        student={editingStudent}
        onSuccess={() => {
          setFormOpen(false);
          setEditingStudent(null);
          loadStudents();
          router.replace("/students");
        }}
      />

      <BulkUploadDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onSuccess={() => loadStudents()}
      />
    </>
  );
}
