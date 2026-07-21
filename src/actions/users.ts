"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.types";

export async function getUsers(): Promise<Tables<"profiles">[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .neq("role", "student")
    .order("is_approved", { ascending: true })
    .order("full_name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function updateUser(id: string, updates: { full_name?: string; role?: "admin" | "teacher"; is_active?: boolean }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/users");
  return { success: true };
}

export async function approveUser(id: string, approved: boolean, role?: "admin" | "teacher") {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Only admins can approve users" };

  const updates: { is_approved: boolean; role?: "admin" | "teacher" } = { is_approved: approved };
  if (role) updates.role = role;

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/users");
  return { success: true };
}
