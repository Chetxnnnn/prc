"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteStudent } from "@/actions/students";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import type { Tables } from "@/types/database.types";
import { StudentFormDialog } from "./student-form";

interface StudentActionsProps {
  student: Tables<"students">;
}

export function StudentActions({ student }: StudentActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteStudent(student.id);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Student deleted");
      router.push("/students");
    }
    setDeleting(false);
  }

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1" onClick={() => setEditOpen(true)}>
        <Pencil className="h-3 w-3" />
        Edit
      </Button>
      <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
        <Trash2 className="h-3 w-3" />
        Delete
      </Button>

      <StudentFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        student={student}
        onSuccess={() => {
          setEditOpen(false);
          router.refresh();
        }}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {student.full_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
