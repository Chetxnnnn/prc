"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AttendanceBarChartProps {
  data: { date: string; present: number; absent: number; late: number; total: number }[];
}

function formatDay(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
}

export function AttendanceBarChart({ data }: AttendanceBarChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatDay(d.date),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Attendance — last 7 days</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 || data.every((d) => d.total === 0) ? (
          <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
            No attendance data for the past week
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#A0AEC0" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#A0AEC0" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)",
                }}
              />
              <Legend
                iconSize={8}
                wrapperStyle={{ fontSize: 11 }}
              />
              <Bar dataKey="present" name="Present" fill="#10B981" radius={[2, 2, 0, 0]} />
              <Bar dataKey="absent" name="Absent" fill="#EF4444" radius={[2, 2, 0, 0]} />
              <Bar dataKey="late" name="Late" fill="#F59E0B" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
