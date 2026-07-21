"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { CreditCard } from "lucide-react";

interface FeeRow {
  id: string;
  full_name: string;
  class_number: number;
  board: string;
  monthly_fee: number;
  paid: number;
  balance: number;
  status: "paid" | "partial" | "unpaid";
}

interface FeeTableProps {
  data: FeeRow[];
  loading: boolean;
  onRecordPayment: (student: FeeRow) => void;
}

const statusConfig = {
  paid: {
    label: "Paid",
    className: "bg-success/10 text-success border-success/20",
  },
  partial: {
    label: "Partial",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  unpaid: {
    label: "Unpaid",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

const boardLabels: Record<string, string> = {
  cbse: "CBSE",
  icse: "ICSE",
  state: "State",
};

export function FeeTable({ data, loading, onRecordPayment }: FeeTableProps) {
  const columns: ColumnDef<FeeRow>[] = [
    {
      accessorKey: "full_name",
      header: "Student",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("full_name")}</span>
      ),
    },
    {
      accessorKey: "class_number",
      header: "Class",
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.class_number} &middot; {boardLabels[row.original.board]}
        </span>
      ),
    },
    {
      accessorKey: "monthly_fee",
      header: () => <div className="text-right">Monthly fee</div>,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-right block">
          ₹{row.original.monthly_fee.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      accessorKey: "paid",
      header: () => <div className="text-right">Paid</div>,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-right block text-success">
          ₹{row.original.paid.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      accessorKey: "balance",
      header: () => <div className="text-right">Balance</div>,
      cell: ({ row }) => (
        <span
          className={`font-mono text-sm text-right block ${
            row.original.balance > 0 ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          ₹{row.original.balance.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const config = statusConfig[status];
        return (
          <Badge variant="outline" className={config.className}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const student = row.original;
        return (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => onRecordPayment(student)}
          >
            <CreditCard className="h-3 w-3" />
            Record
          </Button>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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
          Add students to start tracking fees.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
                <TableRow key={row.id}>
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
                  No fee data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data.length} student{data.length !== 1 ? "s" : ""}
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
    </div>
  );
}
