import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StudentActions } from "@/components/features/students/student-actions";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const boardLabels: Record<string, string> = {
  cbse: "CBSE",
  icse: "ICSE",
  state: "State Board",
};

const statusStyles: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  inactive: "bg-warning/10 text-warning border-warning/20",
  dropped: "bg-destructive/10 text-destructive border-destructive/20",
};

const genderLabels: Record<string, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .single();

  if (!student) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .single();

  const isAdmin = profile?.role === "admin";

  const { data: attendance } = await supabase
    .from("attendance")
    .select("status, attendance_date")
    .eq("student_id", id)
    .order("attendance_date", { ascending: false })
    .limit(30);

  const { data: payments } = await supabase
    .from("fee_payments")
    .select("amount, payment_month, payment_date, mode, receipt_number, notes, created_at")
    .eq("student_id", id)
    .order("payment_month", { ascending: false })
    .limit(12);

  const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

  return (
    <>
      <AppHeader
        title={student.full_name}
        subtitle={`Class ${student.class_number} · ${boardLabels[student.board]}`}
        actions={
          isAdmin ? (
            <StudentActions student={student} />
          ) : null
        }
      />

      <div className="mb-4">
        <Link href="/students" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to students
          </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Full name</p>
                  <p className="text-sm font-medium">{student.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{student.email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date of birth</p>
                  <p className="text-sm font-medium">{student.date_of_birth}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gender</p>
                  <p className="text-sm font-medium">{genderLabels[student.gender]}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contact</p>
                  <p className="text-sm font-medium font-mono">{student.contact_number}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Parent</p>
                  <p className="text-sm font-medium">{student.parent_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Parent contact</p>
                  <p className="text-sm font-medium font-mono">{student.parent_contact}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">School</p>
                  <p className="text-sm font-medium">{student.school_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Previous year performance</p>
                  <p className="text-sm font-medium">{student.previous_academic_performance || "—"}</p>
                </div>
                {student.address && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="text-sm font-medium">{student.address}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attendance history</CardTitle>
            </CardHeader>
            <CardContent>
              {attendance && attendance.length > 0 ? (
                <div className="space-y-2">
                  {attendance.map((att) => (
                    <div
                      key={att.attendance_date}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <span className="text-sm">{att.attendance_date}</span>
                      <Badge
                        variant="outline"
                        className={
                          att.status === "present"
                            ? "bg-success/10 text-success border-success/20"
                            : att.status === "absent"
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : "bg-warning/10 text-warning border-warning/20"
                        }
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {att.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No attendance recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Academic info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="outline" className={statusStyles[student.status]}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {student.status}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Board</span>
                <span className="text-sm font-medium">{boardLabels[student.board]}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Class</span>
                <span className="text-sm font-medium font-mono">{student.class_number}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Enrolled</span>
                <span className="text-sm font-medium">{student.enrollment_date}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Notifications</span>
                <Badge variant="outline" className={student.send_notifications ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground border-border"}>
                  {student.send_notifications ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Subjects</p>
                <div className="flex flex-wrap gap-1">
                  {student.subjects.map((subject) => (
                    <Badge key={subject} variant="secondary" className="text-xs">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fee summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Monthly fee</span>
                <span className="text-sm font-medium font-mono">
                  ₹{Number(student.monthly_fee).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total paid</span>
                <span className="text-sm font-medium font-mono text-success">
                  ₹{totalPaid.toLocaleString("en-IN")}
                </span>
              </div>
              {payments && payments.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Recent payments</p>
                    {payments.slice(0, 6).map((p, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 text-sm border-b border-border last:border-0">
                        <div>
                          <span className="text-muted-foreground">{p.payment_month}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            paid {new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <span className="font-mono">₹{Number(p.amount).toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
