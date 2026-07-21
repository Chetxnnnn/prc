"use client";

import Link from "next/link";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Eye, MoreHorizontal, Trash2, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { deleteStudent, bulkDeleteStudents } from "@/actions/students";
import type { Tables } from "@/types/database.types";

type Student = Tables<"students">;

interface StudentTableProps {
  data: Student[];
  loading: boolean;
  onEdit: (student: Student) => void;
  onDelete?: () => void;
}

const statusStyles: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  inactive: "bg-warning/10 text-warning border-warning/20",
  dropped: "bg-destructive/10 text-destructive border-destructive/20",
};

const boardLabels: Record<string, string> = {
  cbse: "CBSE",
  icse: "ICSE",
  state: "State",
};

export function StudentTable({ data, loading, onEdit, onDelete }: StudentTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const selectedIds = Object.keys(rowSelection).map((idx) => data[Number(idx)]?.id).filter(Boolean);

  async function handleDeleteSingle(student: Student) {
    setDeleting(true);
    const result = await deleteStudent(student.id);
    setDeleting(false);
    setDeletingStudent(null);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(`${student.full_name} deleted`);
      onDelete?.();
    }
  }

  async function handleBulkDelete() {
    setDeleting(true);
    const result = await bulkDeleteStudents(selectedIds);
    setDeleting(false);
    setBulkDeleteOpen(false);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(`${result?.count ?? selectedIds.length} student${selectedIds.length !== 1 ? "s" : ""} deleted`);
      setRowSelection({});
      onDelete?.();
    }
  }

  const columns: ColumnDef<Student>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          ref={(el) => {
            if (el && typeof el === "object" && "indeterminate" in el) {
              (el as HTMLInputElement).indeterminate = table.getIsSomePageRowsSelected();
            }
          }}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      size: 40,
    },
    {
      accessorKey: "full_name",
      header: "Name",
      cell: ({ row }) => (
        <Link
          href={`/students/${row.original.id}`}
          className="font-medium text-foreground hover:underline"
        >
          {row.getValue("full_name")}
        </Link>
      ),
    },
    {
      accessorKey: "class_number",
      header: "Class",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.getValue("class_number")}</span>
      ),
    },
    {
      accessorKey: "board",
      header: "Board",
      cell: ({ row }) => (
        <span className="text-sm">{boardLabels[row.original.board]}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge variant="outline" className={statusStyles[status]}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "subjects",
      header: "Subjects",
      cell: ({ row }) => {
        const subjects = row.original.subjects;
        return (
          <span className="text-sm text-muted-foreground">
            {subjects.length > 0 ? `${subjects.length} subject${subjects.length !== 1 ? "s" : ""}` : "—"}
          </span>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem render={<Link href={`/students/${student.id}`} />} className="gap-2">
                    <Eye className="h-4 w-4" />
                    View details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(student)} className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit student
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeletingStudent(student)}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete student
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: { pageSize: 15 },
    },
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium text-muted-foreground">No students found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Add your first student to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border">
          <span className="text-sm text-muted-foreground">
            {selectedIds.length} selected
          </span>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-destructive hover:text-destructive"
            onClick={() => setBulkDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete selected ({selectedIds.length})
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
                  data-state={row.getIsSelected() && "selected"}
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

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} student{table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}
        </p>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => table.previousPage()}
                className={!table.getCanPreviousPage() ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="text-sm px-3">
                {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={() => table.nextPage()}
                className={!table.getCanNextPage() ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Single delete dialog */}
      <AlertDialog open={!!deletingStudent} onOpenChange={(open) => { if (!open) setDeletingStudent(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingStudent?.full_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingStudent && handleDeleteSingle(deletingStudent)}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete dialog */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} student{selectedIds.length !== 1 ? "s" : ""}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.length} student{selectedIds.length !== 1 ? "s" : ""}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete all"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
