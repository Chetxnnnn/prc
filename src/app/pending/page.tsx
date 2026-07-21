import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PendingApproval } from "@/components/features/auth/pending-approval";

export default async function PendingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, is_approved, is_active")
    .eq("id", user.id)
    .single();

  if (profile?.is_approved && profile?.is_active) redirect("/dashboard");

  const status = !profile?.is_approved ? "pending" : "inactive";

  return <PendingApproval name={profile?.full_name ?? user.email ?? "User"} status={status} />;
}
