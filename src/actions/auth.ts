"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function errMsg(e: unknown): string {
  if (!e) return "Unknown error";
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e !== null) {
    const obj = e as Record<string, unknown>;
    if (typeof obj.message === "string" && obj.message) return obj.message;
    if (typeof obj.error === "string" && obj.error) return obj.error;
    if (typeof obj.error_description === "string") return obj.error_description;
    if (typeof obj.hint === "string" && obj.hint) return obj.hint;
  }
  return "An unexpected error occurred.";
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: errMsg(error) };
    }

    if (!data.session) {
      return { error: "No session created." };
    }
  } catch (e) {
    return { error: "Failed to connect: " + errMsg(e) };
  }

  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const fullName = String(formData.get("full_name") || "");
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  if (!fullName || fullName.length < 2) {
    return { error: "Name must be at least 2 characters." };
  }
  if (!email) {
    return { error: "Email is required." };
  }
  if (!password || password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  try {
    const supabase = await createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: "teacher" },
      },
    });

    if (signUpError) {
      return { error: errMsg(signUpError) };
    }

    if (!data.user) {
      return { error: "Signup failed." };
    }

    if (data.user.identities && data.user.identities.length === 0) {
      return { error: "An account with this email already exists." };
    }

    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        return { error: "Email confirmation required. Please check your inbox." };
      }
    }
  } catch (e) {
    return { error: "Failed to connect: " + errMsg(e) };
  }

  redirect("/pending");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function getUserRole() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role ?? null;
}
