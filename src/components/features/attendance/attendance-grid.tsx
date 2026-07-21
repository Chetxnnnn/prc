"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StudentAttendance {
  id: string;
  full_name: string;
  class_number: number;
  board: string;
  status: "present" | "absent" | "late" | null;
}

interface AttendanceGridProps {
  students: StudentAttendance[];
  statuses: Map<string, "present" | "absent" | "late" | null>;
  onToggle: (studentId: string) => void;
  loading: boolean;
}

const statusConfig = {
  present: {
    label: "Present",
    className: "bg-success/10 text-success border-success/20 hover:bg-success/20",
    dotClass: "bg-success",
  },
  absent: {
    label: "Absent",
    className: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
    dotClass: "bg-destructive",
  },
  late: {
    label: "Late",
    className: "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20",
    dotClass: "bg-warning",
  },
  null: {
    label: "—",
    className: "bg-muted text-muted-foreground border-border hover:bg-muted/80",
    dotClass: "bg-muted-foreground",
  },
};

const boardLabels: Record<string, string> = {
  cbse: "CBSE",
  icse: "ICSE",
  state: "State",
};

export function AttendanceGrid({
  students,
  statuses,
  onToggle,
  loading,
}: AttendanceGridProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium text-muted-foreground">No students found</p>
        <p className="text-sm text-muted-foreground mt-1">
          No active students for the selected class.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Class</TableHead>
            <TableHead className="text-center">Attendance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student, index) => {
            const currentStatus = statuses.get(student.id) ?? null;
            const config = statusConfig[currentStatus as keyof typeof statusConfig];

            return (
              <TableRow key={student.id}>
                <TableCell className="text-muted-foreground font-mono text-sm">
                  {index + 1}
                </TableCell>
                <TableCell className="font-medium">{student.full_name}</TableCell>
                <TableCell className="text-sm">
                  {student.class_number} &middot; {boardLabels[student.board]}
                </TableCell>
                <TableCell className="text-center">
                  <button
                    onClick={() => onToggle(student.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-colors",
                      config.className
                    )}
                  >
                    <span className={cn("h-2 w-2 rounded-full", config.dotClass)} />
                    {config.label}
                  </button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
