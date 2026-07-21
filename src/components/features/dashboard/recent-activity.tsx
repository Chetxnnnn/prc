import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  UserPlus,
  CalendarCheck,
  IndianRupee,
  UserCheck,
  UserX,
} from "lucide-react";

interface RecentActivityProps {
  supabase: SupabaseClient;
}

interface ActivityItem {
  id: string;
  type: "student_added" | "student_approved" | "student_deactivated" | "attendance_marked" | "fee_paid";
  description: string;
  detail: string;
  timestamp: string;
  icon: typeof UserPlus;
  color: string;
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export async function RecentActivity({ supabase }: RecentActivityProps) {
  const activities: ActivityItem[] = [];

  const { data: recentStudents } = await supabase
    .from("students")
    .select("id, full_name, class_number, board, status, created_at, is_approved")
    .order("created_at", { ascending: false })
    .limit(5);

  recentStudents?.forEach((s) => {
    if (s.status === "inactive" || s.status === "dropped") {
      activities.push({
        id: `student-${s.id}`,
        type: "student_deactivated",
        description: `${s.full_name} marked as ${s.status}`,
        detail: `Class ${s.class_number} · ${s.board.toUpperCase()}`,
        timestamp: s.created_at,
        icon: UserX,
        color: "text-destructive",
      });
    } else if (s.is_approved) {
      activities.push({
        id: `student-${s.id}`,
        type: "student_approved",
        description: `${s.full_name} was approved`,
        detail: `Class ${s.class_number} · ${s.board.toUpperCase()}`,
        timestamp: s.created_at,
        icon: UserCheck,
        color: "text-success",
      });
    } else {
      activities.push({
        id: `student-${s.id}`,
        type: "student_added",
        description: `${s.full_name} registered`,
        detail: `Class ${s.class_number} · ${s.board.toUpperCase()}`,
        timestamp: s.created_at,
        icon: UserPlus,
        color: "text-primary",
      });
    }
  });

  const { data: recentAttendance } = await supabase
    .from("attendance")
    .select("id, status, attendance_date, created_at, students(full_name)")
    .order("created_at", { ascending: false })
    .limit(5);

  recentAttendance?.forEach((a) => {
    const studentName = (a.students as unknown as { full_name: string })?.full_name;
    activities.push({
      id: `att-${a.id}`,
      type: "attendance_marked",
      description: `${studentName} marked ${a.status}`,
      detail: a.attendance_date,
      timestamp: a.created_at,
      icon: CalendarCheck,
      color: a.status === "present" ? "text-success" : a.status === "absent" ? "text-destructive" : "text-warning",
    });
  });

  const { data: recentPayments } = await supabase
    .from("fee_payments")
    .select("id, amount, payment_month, created_at, students(full_name)")
    .order("created_at", { ascending: false })
    .limit(5);

  recentPayments?.forEach((p) => {
    const studentName = (p.students as unknown as { full_name: string })?.full_name;
    activities.push({
      id: `fee-${p.id}`,
      type: "fee_paid",
      description: `₹${Number(p.amount).toLocaleString("en-IN")} paid by ${studentName}`,
      detail: p.payment_month,
      timestamp: p.created_at,
      icon: IndianRupee,
      color: "text-success",
    });
  });

  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const topActivities = activities.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {topActivities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-1">
            {topActivities.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 py-2.5 border-b border-border last:border-0"
                >
                  <div className={`mt-0.5 ${item.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.description}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {timeAgo(item.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
