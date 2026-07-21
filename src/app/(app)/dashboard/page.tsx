import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { StatsCard } from "@/components/features/dashboard/stats-card";
import { RecentActivity } from "@/components/features/dashboard/recent-activity";
import { QuickActions } from "@/components/features/dashboard/quick-actions";
import { AttendancePieChart } from "@/components/features/dashboard/attendance-pie-chart";
import { FeePieChart } from "@/components/features/dashboard/fee-pie-chart";
import { AttendanceBarChart } from "@/components/features/dashboard/attendance-bar-chart";
import { Users, CalendarCheck, IndianRupee, AlertCircle } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  const today = new Date().toLocaleDateString("sv-SE");
  const firstOfMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;

  const [
    { count: totalStudents },
    { data: todayAttendance },
    { data: feeSummary },
  ] = await Promise.all([
    supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("attendance")
      .select("status")
      .eq("attendance_date", today),
    supabase.rpc("get_fee_collection_summary", { p_month: firstOfMonth }),
  ]);

  const presentCount = todayAttendance?.filter((a) => a.status === "present").length ?? 0;
  const absentCount = todayAttendance?.filter((a) => a.status === "absent").length ?? 0;
  const lateCount = todayAttendance?.filter((a) => a.status === "late").length ?? 0;
  const totalMarked = presentCount + absentCount + lateCount;

  const feeData = feeSummary?.[0];

  const last7Days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toLocaleDateString("sv-SE"));
  }

  const { data: weekAttendance } = await supabase
    .from("attendance")
    .select("status, attendance_date")
    .in("attendance_date", last7Days);

  const attendanceByDay = last7Days.map((date) => {
    const dayRecords = weekAttendance?.filter((a) => a.attendance_date === date) ?? [];
    const present = dayRecords.filter((a) => a.status === "present").length;
    const absent = dayRecords.filter((a) => a.status === "absent").length;
    const late = dayRecords.filter((a) => a.status === "late").length;
    return { date, present, absent, late, total: present + absent + late };
  });

  return (
    <>
      <AppHeader
        title="Dashboard"
        subtitle={`Welcome back, ${profile?.full_name}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          label="Active students"
          value={totalStudents ?? 0}
          icon={Users}
        />
        <StatsCard
          label="Today's attendance"
          value={totalMarked}
          subtitle={`${presentCount} present, ${absentCount} absent`}
          icon={CalendarCheck}
        />
        <StatsCard
          label="Fees collected"
          value={`₹${(feeData?.total_collected ?? 0).toLocaleString("en-IN")}`}
          subtitle={`of ₹${(feeData?.total_expected ?? 0).toLocaleString("en-IN")} expected`}
          icon={IndianRupee}
        />
        <StatsCard
          label="Pending dues"
          value={(feeData?.unpaid_count ?? 0) + (feeData?.partial_count ?? 0)}
          subtitle={`${feeData?.paid_count ?? 0} fully paid`}
          icon={AlertCircle}
          variant={(feeData?.unpaid_count ?? 0) > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <AttendancePieChart
          present={presentCount}
          absent={absentCount}
          late={lateCount}
        />
        <FeePieChart
          paid={feeData?.paid_count ?? 0}
          partial={feeData?.partial_count ?? 0}
          unpaid={feeData?.unpaid_count ?? 0}
          totalCollected={feeData?.total_collected ?? 0}
          totalExpected={feeData?.total_expected ?? 0}
        />
        <QuickActions isAdmin={isAdmin} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AttendanceBarChart data={attendanceByDay} />
        </div>
        <div>
          <RecentActivity supabase={supabase} />
        </div>
      </div>
    </>
  );
}
