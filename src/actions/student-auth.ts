"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { studentSignupSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";

function errMsg(e: unknown): string {
  if (!e) return "Unknown error";
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e !== null) {
    const obj = e as Record<string, unknown>;
    if (typeof obj.message === "string" && obj.message) return obj.message;
    if (typeof obj.error === "string" && obj.error) return obj.error;
    if (typeof obj.error_description === "string") return obj.error_description;
  }
  return "An unexpected error occurred.";
}

export async function studentSignup(formData: FormData) {
  const raw = {
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
    full_name: String(formData.get("full_name") || ""),
    date_of_birth: String(formData.get("date_of_birth") || ""),
    gender: String(formData.get("gender") || ""),
    contact_number: String(formData.get("contact_number") || ""),
    parent_name: String(formData.get("parent_name") || ""),
    parent_contact: String(formData.get("parent_contact") || ""),
    address: String(formData.get("address") || "") || undefined,
    board: String(formData.get("board") || ""),
    class_number: formData.get("class_number"),
    school_name: String(formData.get("school_name") || "") || undefined,
    previous_academic_performance: String(formData.get("previous_academic_performance") || "") || undefined,
    subjects: formData.getAll("subjects").map(String),
  };

  const parsed = studentSignupSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  try {
    const supabase = await createClient();

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name, role: "student" },
      },
    });

    if (signUpError) {
      return { error: errMsg(signUpError) };
    }

    if (!authData.user) {
      return { error: "Signup failed." };
    }

    if (authData.user.identities && authData.user.identities.length === 0) {
      return { error: "An account with this email already exists." };
    }

    const { error: studentError } = await supabase.from("students").insert({
      auth_user_id: authData.user.id,
      full_name: data.full_name,
      email: data.email,
      date_of_birth: data.date_of_birth,
      gender: data.gender as "male" | "female" ,
      contact_number: data.contact_number,
      parent_name: data.parent_name,
      parent_contact: data.parent_contact,
      address: data.address ?? null,
      board: data.board as "cbse" | "icse" | "state",
      class_number: data.class_number,
      school_name: data.school_name ?? null,
      previous_academic_performance: data.previous_academic_performance ?? null,
      subjects: data.subjects,
      status: "active",
      is_approved: false,
      monthly_fee: 0,
    });

    if (studentError) {
      console.error("[studentSignup] insert error:", studentError.message);
      return { error: "Failed to create student profile: " + studentError.message };
    }

    if (!authData.session) {
      await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
    }
  } catch (e) {
    return { error: "Failed to connect: " + errMsg(e) };
  }

  redirect("/student/pending");
}

export async function getPendingStudents() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return [];

  const { data, error } = await supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function approveStudent(studentId: string, approved: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Only admins can approve students" };

  const { error } = await supabase
    .from("students")
    .update({ is_approved: approved })
    .eq("id", studentId);

  if (error) return { error: error.message };

  revalidatePath("/users");
  return { success: true };
}

export async function batchApproveStudents(studentIds: string[], approved: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Only admins can approve students" };

  if (studentIds.length === 0) return { success: true, count: 0 };

  const { data, error } = await supabase.rpc("batch_approve_students", {
    p_student_ids: studentIds,
    p_approved: approved,
  });

  if (error) return { error: error.message };

  revalidatePath("/users");
  return { success: true, count: data as number };
}

export async function getStudentByAuthId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("students")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  return data;
}
