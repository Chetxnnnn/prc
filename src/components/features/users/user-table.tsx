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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { updateUser, approveUser } from "@/actions/users";
import type { Tables } from "@/types/database.types";

type User = Tables<"profiles">;

interface UserTableProps {
  data: User[];
  loading: boolean;
  onRefresh: () => void;
}

const roleStyles: Record<string, string> = {
  admin: "bg-primary/10 text-primary border-primary/20",
  teacher: "bg-secondary text-secondary-foreground border-border",
};

export function UserTable({ data, loading, onRefresh }: UserTableProps) {
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<"admin" | "teacher">("teacher");
  const [editActive, setEditActive] = useState(true);
  const [editApproved, setEditApproved] = useState(true);
  const [saving, setSaving] = useState(false);

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "full_name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("full_name")}</span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.getValue("email")}</span>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        return (
          <Badge variant="outline" className={roleStyles[role]}>
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: "is_approved",
      header: "Approval",
      cell: ({ row }) => {
        const approved = row.getValue("is_approved") as boolean;
        return approved ? (
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            Approved
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
            Pending
          </Badge>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const active = row.getValue("is_active") as boolean;
        return (
          <Badge variant="outline" className={active ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground border-border"}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {active ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => {
              setEditUser(user);
              setEditRole(user.role as "admin" | "teacher");
              setEditActive(user.is_active);
              setEditApproved(user.is_approved);
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
    if (!editUser) return;
    setSaving(true);

    if (!editUser.is_approved && editApproved) {
      const result = await approveUser(editUser.id, true, editRole);
      if (result?.error) {
        toast.error(result.error);
        setSaving(false);
        return;
      }
    } else if (editUser.is_approved && !editApproved) {
      const result = await approveUser(editUser.id, false);
      if (result?.error) {
        toast.error(result.error);
        setSaving(false);
        return;
      }
    }

    const result = await updateUser(editUser.id, {
      role: editRole,
      is_active: editActive,
    });
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("User updated");
      setEditUser(null);
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
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) setEditUser(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">{editUser.full_name}</p>
                <p className="text-xs text-muted-foreground">{editUser.email}</p>
              </div>

              {!editUser.is_approved && (
                <div className="flex items-center justify-between">
                  <Label>Approve</Label>
                  <Switch checked={editApproved} onCheckedChange={setEditApproved} />
                </div>
              )}

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={editRole} onValueChange={(v) => setEditRole(v as "admin" | "teacher")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch checked={editActive} onCheckedChange={setEditActive} />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditUser(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
