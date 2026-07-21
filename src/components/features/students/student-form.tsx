"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { studentSchema, type StudentInput, ALL_SUBJECTS } from "@/lib/validators";
import { createStudent, updateStudent } from "@/actions/students";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { Tables } from "@/types/database.types";

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Tables<"students"> | null;
  onSuccess: () => void;
}

export function StudentFormDialog({
  open,
  onOpenChange,
  student,
  onSuccess,
}: StudentFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [sendNotifications, setSendNotifications] = useState(true);
  const isEdit = !!student;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<StudentInput>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      full_name: student?.full_name ?? "",
      date_of_birth: student?.date_of_birth ?? "",
      gender: student?.gender ?? undefined,
      contact_number: student?.contact_number ?? "",
      parent_name: student?.parent_name ?? "",
      parent_contact: student?.parent_contact ?? "",
      address: student?.address ?? "",
      board: student?.board ?? undefined,
      class_number: student?.class_number ?? undefined,
      subjects: student?.subjects ?? [],
      enrollment_date: student?.enrollment_date ?? new Date().toISOString().split("T")[0],
      status: student?.status ?? "active" as const,
      monthly_fee: student?.monthly_fee ?? 0,
    },
  });

  const selectedSubjects = watch("subjects");
  const watchGender = watch("gender");
  const watchBoard = watch("board");
  const watchClass = watch("class_number");
  const watchStatus = watch("status");

  useEffect(() => {
    if (open) {
      setSendNotifications(student?.send_notifications ?? true);
      reset({
        full_name: student?.full_name ?? "",
        email: student?.email ?? "",
        date_of_birth: student?.date_of_birth ?? "",
        gender: student?.gender ?? undefined,
        contact_number: student?.contact_number ?? "",
        parent_name: student?.parent_name ?? "",
        parent_contact: student?.parent_contact ?? "",
        address: student?.address ?? "",
        board: student?.board ?? undefined,
        class_number: student?.class_number ?? undefined,
        school_name: student?.school_name ?? "",
        previous_academic_performance: student?.previous_academic_performance ?? "",
        subjects: student?.subjects ?? [],
        enrollment_date: student?.enrollment_date ?? new Date().toISOString().split("T")[0],
        status: student?.status ?? ("active" as const),
        monthly_fee: student?.monthly_fee ?? 0,
      });
    }
  }, [open, student, reset]);

  function toggleSubject(subject: string) {
    const current = selectedSubjects || [];
    if (current.includes(subject)) {
      setValue("subjects", current.filter((s) => s !== subject), { shouldValidate: true });
    } else {
      setValue("subjects", [...current, subject], { shouldValidate: true });
    }
  }

  async function onSubmit(data: StudentInput) {
    setLoading(true);
    try {
      const payload = { ...data, send_notifications: sendNotifications };
      const result = isEdit
        ? await updateStudent(student.id, payload as any)
        : await createStudent(payload as any);

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(isEdit ? "Student updated" : "Student added");
        reset();
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit student" : "Add new student"}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-100px)] pr-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Personal details
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">
                    Full name <span className="text-destructive">*</span>
                  </Label>
                  <Input id="full_name" {...register("full_name")} />
                  {errors.full_name && (
                    <p className="text-sm text-destructive">{errors.full_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">
                    Date of birth <span className="text-destructive">*</span>
                  </Label>
                  <Input id="date_of_birth" type="date" max={new Date().toISOString().split("T")[0]} {...register("date_of_birth")} />
                  {errors.date_of_birth && (
                    <p className="text-sm text-destructive">{errors.date_of_birth.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Gender <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={watchGender}
                    onValueChange={(v) => setValue("gender", v as "male" | "female", { shouldValidate: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-sm text-destructive">{errors.gender.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_number">
                    Contact number <span className="text-destructive">*</span>
                  </Label>
                  <Input id="contact_number" {...register("contact_number")} />
                  {errors.contact_number && (
                    <p className="text-sm text-destructive">{errors.contact_number.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parent_name">
                    Parent name <span className="text-destructive">*</span>
                  </Label>
                  <Input id="parent_name" {...register("parent_name")} />
                  {errors.parent_name && (
                    <p className="text-sm text-destructive">{errors.parent_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parent_contact">
                    Parent contact <span className="text-destructive">*</span>
                  </Label>
                  <Input id="parent_contact" {...register("parent_contact")} />
                  {errors.parent_contact && (
                    <p className="text-sm text-destructive">{errors.parent_contact.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" rows={2} {...register("address")} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="student@example.com" {...register("email")} />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school_name">School name</Label>
                  <Input id="school_name" placeholder="Current school" {...register("school_name")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="previous_academic_performance">Previous year percentage / CGPA</Label>
                <Input id="previous_academic_performance" placeholder="e.g. 85% or 9.2 CGPA" {...register("previous_academic_performance")} />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Academic details
              </p>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>
                    Board <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={watchBoard}
                    onValueChange={(v) => setValue("board", v as "cbse" | "icse" | "state", { shouldValidate: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select board" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cbse">CBSE</SelectItem>
                      <SelectItem value="icse">ICSE</SelectItem>
                      <SelectItem value="state">State Board</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.board && (
                    <p className="text-sm text-destructive">{errors.board.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Class <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={watchClass ? String(watchClass) : ""}
                    onValueChange={(v) => setValue("class_number", Number(v), { shouldValidate: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((c) => (
                        <SelectItem key={c} value={String(c)}>
                          Class {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.class_number && (
                    <p className="text-sm text-destructive">{errors.class_number.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthly_fee">Monthly fee (₹)</Label>
                  <Input
                    id="monthly_fee"
                    type="number"
                    step="0.01"
                    {...register("monthly_fee")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="enrollment_date">
                    Enrollment date <span className="text-destructive">*</span>
                  </Label>
                  <Input id="enrollment_date" type="date" max={new Date().toISOString().split("T")[0]} {...register("enrollment_date")} />
                  {errors.enrollment_date && (
                    <p className="text-sm text-destructive">{errors.enrollment_date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={watchStatus ?? "active"}
                    onValueChange={(v) => setValue("status", v as "active" | "inactive" | "dropped")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="dropped">Dropped</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-md border">
                <div className="space-y-0.5">
                  <Label className="text-sm">Attendance notifications</Label>
                  <p className="text-xs text-muted-foreground">Send attendance updates to parent via WhatsApp/SMS</p>
                </div>
                <Switch
                  checked={sendNotifications}
                  onCheckedChange={setSendNotifications}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Subjects <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_SUBJECTS.map((subject) => (
                    <label
                      key={subject}
                      className="flex items-center gap-2 p-2 rounded-md border hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedSubjects?.includes(subject)}
                        onCheckedChange={() => toggleSubject(subject)}
                      />
                      <span className="text-sm">{subject}</span>
                    </label>
                  ))}
                </div>
                {errors.subjects && (
                  <p className="text-sm text-destructive">{errors.subjects.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : isEdit ? "Save changes" : "Add student"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
