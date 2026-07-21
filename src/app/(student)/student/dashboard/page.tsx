import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { logout } from "@/actions/auth";

const boardLabel: Record<string, string> = { cbse: "CBSE", icse: "ICSE", state: "State" };
const genderLabel: Record<string, string> = { male: "Male", female: "Female" };

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/student/login");

  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!student) redirect("/student/login");
  if (!student.is_approved) redirect("/student/pending");

  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data: attendance } = await supabase
    .from("attendance")
    .select("attendance_date, status")
    .eq("student_id", student.id)
    .gte("attendance_date", thirtyDaysAgo)
    .lte("attendance_date", today)
    .order("attendance_date", { ascending: false });

  const presentCount = attendance?.filter((a) => a.status === "present").length ?? 0;
  const absentCount = attendance?.filter((a) => a.status === "absent").length ?? 0;
  const lateCount = attendance?.filter((a) => a.status === "late").length ?? 0;

  return (
    <div className="max-w-2xl mx-auto p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {student.full_name}</h1>
            <p className="text-muted-foreground">Class {student.class_number} &middot; {boardLabel[student.board] ?? student.board}</p>
          </div>
          <form action={logout}>
            <Button type="submit" variant="destructive" size="sm">Sign out</Button>
          </form>
        </div>

        <Card>
          <CardHeader><CardTitle>My Profile</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Full Name</p>
              <p className="font-medium">{student.full_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Contact</p>
              <p className="font-medium">{student.contact_number}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Date of Birth</p>
              <p className="font-medium">{student.date_of_birth}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Gender</p>
              <p className="font-medium">{genderLabel[student.gender] ?? student.gender}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Parent</p>
              <p className="font-medium">{student.parent_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Parent Contact</p>
              <p className="font-medium">{student.parent_contact}</p>
            </div>
            {student.address && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Address</p>
                <p className="font-medium">{student.address}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Enrolled</p>
              <p className="font-medium">{student.enrollment_date}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <Badge variant="outline" className={student.status === "active" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground border-border"}>
                {student.status}
              </Badge>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Subjects</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {student.subjects?.map((s) => (
                  <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>My Attendance (Last 30 Days)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{presentCount}</p>
                <p className="text-sm text-muted-foreground">Present</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{absentCount}</p>
                <p className="text-sm text-muted-foreground">Absent</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{lateCount}</p>
                <p className="text-sm text-muted-foreground">Late</p>
              </div>
            </div>

            {attendance && attendance.length > 0 ? (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {attendance.map((a) => (
                  <div key={a.attendance_date} className="flex items-center justify-between py-1 text-sm border-b last:border-0">
                    <span>{new Date(a.attendance_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <Badge variant="outline" className={
                      a.status === "present" ? "bg-green-100 text-green-700 border-green-200" :
                      a.status === "absent" ? "bg-red-100 text-red-700 border-red-200" :
                      "bg-yellow-100 text-yellow-700 border-yellow-200"
                    }>
                      {a.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No attendance records found.</p>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
