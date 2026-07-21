"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Pencil, Check, X, CheckCheck, XCircle } from "lucide-react";
import { approveStudent, batchApproveStudents } from "@/actions/student-auth";
import type { Tables } from "@/types/database.types";

type Student = Tables<"students">;

interface StudentApprovalTableProps {
  data: Student[];
  loading: boolean;
  onRefresh: () => void;
}

export function StudentApprovalTable({ data, loading, onRefresh }: StudentApprovalTableProps) {
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editApproved, setEditApproved] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);

  const unapprovedStudents = data.filter((s) => !s.is_approved);
  const hasUnapproved = unapprovedStudents.length > 0;
  const allUnapprovedSelected = hasUnapproved && unapprovedStudents.every((s) => selectedIds.has(s.id));

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allUnapprovedSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        unapprovedStudents.forEach((s) => next.delete(s.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        unapprovedStudents.forEach((s) => next.add(s.id));
        return next;
      });
    }
  }

  async function handleQuickApprove(student: Student, approved: boolean) {
    const result = await approveStudent(student.id, approved);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(approved ? `${student.full_name} approved` : `${student.full_name} rejected`);
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(student.id); return next; });
      onRefresh();
    }
  }

  async function handleBulkAction(approved: boolean) {
    const ids = [...selectedIds].filter((id) => {
      const student = data.find((s) => s.id === id);
      return student && !student.is_approved;
    });

    if (ids.length === 0) {
      toast.info("No pending students selected");
      return;
    }

    setBulkSaving(true);
    const result = await batchApproveStudents(ids, approved);
    setBulkSaving(false);
    setSelectedIds(new Set());

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(`${result?.count ?? ids.length} student${ids.length !== 1 ? "s" : ""} ${approved ? "approved" : "rejected"}`);
      onRefresh();
    }
  }

  const columns: ColumnDef<Student>[] = [
    {
      id: "select",
      header: () => (
        <Checkbox
          checked={allUnapprovedSelected}
          onCheckedChange={toggleSelectAll}
        />
      ),
      cell: ({ row }) => {
        const student = row.original;
        if (student.is_approved) return <Checkbox disabled />;
        return (
          <Checkbox
            checked={selectedIds.has(student.id)}
            onCheckedChange={() => toggleSelect(student.id)}
          />
        );
      },
      size: 40,
    },
    {
      accessorKey: "full_name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("full_name")}</span>
      ),
    },
    {
      accessorKey: "class_number",
      header: "Class",
      cell: ({ row }) => (
        <span className="text-sm">Class {row.getValue("class_number")}</span>
      ),
    },
    {
      accessorKey: "board",
      header: "Board",
      cell: ({ row }) => {
        const board = row.getValue("board") as string;
        return <Badge variant="outline">{board.toUpperCase()}</Badge>;
      },
    },
    {
      accessorKey: "contact_number",
      header: "Contact",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.getValue("contact_number")}</span>
      ),
    },
    {
      accessorKey: "is_approved",
      header: "Status",
      cell: ({ row }) => {
        const approved = row.getValue("is_approved") as boolean;
        return approved ? (
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">Approved</Badge>
        ) : (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Pending</Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const student = row.original;
        if (!student.is_approved) {
          return (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-success hover:text-success"
                onClick={() => handleQuickApprove(student, true)}
              >
                <Check className="h-3 w-3" />
                Approve
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-destructive hover:text-destructive"
                onClick={() => handleQuickApprove(student, false)}
              >
                <X className="h-3 w-3" />
                Reject
              </Button>
            </div>
          );
        }
        return (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => {
              setEditStudent(student);
              setEditApproved(student.is_approved);
            }}
          >
            <Pencil className="h-3 w-3" />
            Edit
          </Button>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  async function handleSave() {
    if (!editStudent) return;
    setSaving(true);

    const result = await approveStudent(editStudent.id, editApproved);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Student updated");
      setEditStudent(null);
      onRefresh();
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      {hasUnapproved && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} selected
          </span>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-success hover:text-success"
            disabled={bulkSaving || selectedIds.size === 0}
            onClick={() => handleBulkAction(true)}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Approve selected ({selectedIds.size})
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-destructive hover:text-destructive"
            disabled={bulkSaving || selectedIds.size === 0}
            onClick={() => handleBulkAction(false)}
          >
            <XCircle className="h-3.5 w-3.5" />
            Reject selected ({selectedIds.size})
          </Button>
          <div className="w-px h-5 bg-border" />
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={bulkSaving}
            onClick={async () => {
              setBulkSaving(true);
              const result = await batchApproveStudents(
                unapprovedStudents.map((s) => s.id),
                true
              );
              setBulkSaving(false);
              setSelectedIds(new Set());
              if (result?.error) {
                toast.error(result.error);
              } else {
                toast.success(`${result?.count ?? 0} student${(result?.count ?? 0) !== 1 ? "s" : ""} approved`);
                onRefresh();
              }
            }}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Approve all ({unapprovedStudents.length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-destructive hover:text-destructive"
            disabled={bulkSaving}
            onClick={async () => {
              setBulkSaving(true);
              const result = await batchApproveStudents(
                unapprovedStudents.map((s) => s.id),
                false
              );
              setBulkSaving(false);
              setSelectedIds(new Set());
              if (result?.error) {
                toast.error(result.error);
              } else {
                toast.success(`${result?.count ?? 0} student${(result?.count ?? 0) !== 1 ? "s" : ""} rejected`);
                onRefresh();
              }
            }}
          >
            <XCircle className="h-3.5 w-3.5" />
            Reject all ({unapprovedStudents.length})
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={selectedIds.has(row.original.id) ? "bg-muted/50" : ""}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No students found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editStudent} onOpenChange={(open) => { if (!open) setEditStudent(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit student</DialogTitle>
          </DialogHeader>
          {editStudent && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">{editStudent.full_name}</p>
                <p className="text-xs text-muted-foreground">Class {editStudent.class_number} · {editStudent.board.toUpperCase()}</p>
              </div>

              <div className="flex items-center justify-between">
                <Label>Approved</Label>
                <Switch checked={editApproved} onCheckedChange={setEditApproved} />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditStudent(null)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
