import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StudentLoginForm } from "@/components/features/auth/student-login-form";

export default async function StudentLoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: student } = await supabase
      .from("students")
      .select("is_approved")
      .eq("auth_user_id", user.id)
      .single();

    if (student?.is_approved) redirect("/student/dashboard");
    if (student !== null) redirect("/student/pending");
  }

  return <StudentLoginForm />;
}
