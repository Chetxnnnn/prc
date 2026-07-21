import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PendingApproval } from "@/components/features/auth/pending-approval";

export default async function StudentPendingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/student/login");

  const { data: student } = await supabase
    .from("students")
    .select("full_name, is_approved")
    .eq("auth_user_id", user.id)
    .single();

  if (student?.is_approved) redirect("/student/dashboard");

  return <PendingApproval name={student?.full_name ?? user.email ?? "Student"} status="pending" />;
}
