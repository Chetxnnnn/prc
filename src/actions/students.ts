"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { studentSchema, type StudentInput } from "@/lib/validators";
import type { Database } from "@/types/database.types";

export async function getStudents(filters?: {
  search?: string;
  class_number?: number;
  board?: string;
  status?: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("students")
    .select("*")
    .order("full_name", { ascending: true });

  if (error) throw error;

  type StudentRow = Database["public"]["Tables"]["students"]["Row"];
  let results: StudentRow[] = (data ?? []) as StudentRow[];
  if (filters?.search) {
    results = results.filter((s) =>
      s.full_name.toLowerCase().includes(filters.search!.toLowerCase())
    );
  }
  if (filters?.class_number) {
    results = results.filter((s) => s.class_number === filters.class_number);
  }
  if (filters?.board) {
    results = results.filter((s) => s.board === filters.board);
  }
  if (filters?.status) {
    results = results.filter((s) => s.status === filters.status);
  }

  return results;
}

export async function getStudent(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createStudent(input: StudentInput & { send_notifications?: boolean }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const parsed = studentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error } = await supabase.from("students").insert({
    ...parsed.data,
    send_notifications: input.send_notifications ?? true,
    created_by: user.id,
    updated_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/students");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateStudent(id: string, input: StudentInput & { send_notifications?: boolean }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const parsed = studentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error } = await supabase
    .from("students")
    .update({ ...parsed.data, send_notifications: input.send_notifications, updated_by: user.id })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteStudent(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("students").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/students");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function bulkDeleteStudents(ids: string[]) {
  const supabase = await createClient();
  if (ids.length === 0) return { success: true, count: 0 };

  const { error } = await supabase.from("students").delete().in("id", ids);

  if (error) return { error: error.message };

  revalidatePath("/students");
  revalidatePath("/dashboard");
  return { success: true, count: ids.length };
}

export interface BulkStudentRow {
  full_name: string;
  email: string;
  date_of_birth: string;
  gender: string;
  contact_number: string;
  parent_name: string;
  parent_contact: string;
  address: string;
  board: string;
  class_number: string;
  school_name: string;
  previous_academic_performance: string;
  subjects: string;
  enrollment_date: string;
  status: string;
  monthly_fee: string;
}

export interface BulkResult {
  success: number;
  failed: number;
  errors: { row: number; name: string; error: string }[];
}

export async function bulkCreateStudents(rows: BulkStudentRow[]): Promise<BulkResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const result: BulkResult = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // CSV row (1-indexed + header)

    const parsed = studentSchema.safeParse({
      full_name: row.full_name?.trim(),
      email: row.email?.trim() || undefined,
      date_of_birth: row.date_of_birth?.trim() || "2000-01-01",
      gender: row.gender?.trim().toLowerCase() || "male",
      contact_number: row.contact_number?.trim(),
      parent_name: row.parent_name?.trim(),
      parent_contact: row.parent_contact?.trim(),
      address: row.address?.trim() || undefined,
      board: row.board?.trim().toLowerCase(),
      class_number: row.class_number?.trim(),
      school_name: row.school_name?.trim() || undefined,
      previous_academic_performance: row.previous_academic_performance?.trim() || undefined,
      subjects: row.subjects
        ? row.subjects.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean)
        : ["General"],
      enrollment_date: row.enrollment_date?.trim() || new Date().toISOString().split("T")[0],
      status: row.status?.trim().toLowerCase() || "active",
      monthly_fee: row.monthly_fee?.trim() || "0",
    });

    if (!parsed.success) {
      result.failed++;
      result.errors.push({
        row: rowNum,
        name: row.full_name || `Row ${rowNum}`,
        error: parsed.error.issues[0].message,
      });
      continue;
    }

    const { error } = await supabase.from("students").insert({
      ...parsed.data,
      created_by: user.id,
      updated_by: user.id,
    });

    if (error) {
      result.failed++;
      result.errors.push({
        row: rowNum,
        name: row.full_name,
        error: error.message,
      });
    } else {
      result.success++;
    }
  }

  revalidatePath("/students");
  revalidatePath("/dashboard");
  return result;
}
