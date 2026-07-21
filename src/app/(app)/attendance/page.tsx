"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AttendanceGrid } from "@/components/features/attendance/attendance-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCheck, Save, Search, X } from "lucide-react";
import { getAttendanceForDate, markAttendance, markAllPresent } from "@/actions/attendance";
import { toast } from "sonner";

interface StudentAttendance {
  id: string;
  full_name: string;
  class_number: number;
  board: string;
  status: "present" | "absent" | "late" | null;
}

export default function AttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [classFilter, setClassFilter] = useState<string>("");
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [localStatuses, setLocalStatuses] = useState<Map<string, "present" | "absent" | "late" | null>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAttendanceForDate(
        date,
        classFilter ? Number(classFilter) : undefined
      );
      setStudents(data);
      const initial = new Map<string, "present" | "absent" | "late" | null>();
      data.forEach((s) => initial.set(s.id, s.status));
      setLocalStatuses(initial);
      setHasChanges(false);
    } catch {
      console.error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }, [date, classFilter]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const filtered = useMemo(() => {
    let result = students;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s) => s.full_name.toLowerCase().includes(q));
    }

    if (statusFilter !== "all") {
      result = result.filter((s) => {
        const st = localStatuses.get(s.id) ?? null;
        if (statusFilter === "unmarked") return st === null;
        return st === statusFilter;
      });
    }

    const [sortKey, sortDir] = sortBy.split("-") as [string, "asc" | "desc"];
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.full_name.localeCompare(b.full_name);
      else if (sortKey === "class") cmp = a.class_number - b.class_number;
      else if (sortKey === "status") {
        const order: Record<string, number> = { present: 0, late: 1, absent: 2, null: 3 };
        const aStatus = (localStatuses.get(a.id) ?? "null") as string;
        const bStatus = (localStatuses.get(b.id) ?? "null") as string;
        cmp = (order[aStatus] ?? 3) - (order[bStatus] ?? 3);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [students, search, statusFilter, sortBy, localStatuses]);

  function toggleStatus(studentId: string) {
    const current = localStatuses.get(studentId);
    let next: "present" | "absent" | "late" | null;
    if (current === null || current === undefined) next = "present";
    else if (current === "present") next = "absent";
    else if (current === "absent") next = "late";
    else next = null;

    setLocalStatuses((prev) => {
      const nextMap = new Map(prev);
      nextMap.set(studentId, next);
      return nextMap;
    });
    setHasChanges(true);
  }

  async function handleMarkAllPresent() {
    const studentIds = students.map((s) => s.id);
    const result = await markAllPresent(date, studentIds);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("All students marked present");
      const updated = new Map(localStatuses);
      studentIds.forEach((id) => updated.set(id, "present"));
      setLocalStatuses(updated);
      setHasChanges(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    const entries = students.map((s) => ({
      student_id: s.id,
      status: localStatuses.get(s.id) ?? "present" as const,
    }));

    const result = await markAttendance(date, entries);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Attendance saved");
      setHasChanges(false);
    }
    setSaving(false);
  }

  const markedCount = Array.from(localStatuses.values()).filter((s) => s !== null).length;
  const presentCount = Array.from(localStatuses.values()).filter((s) => s === "present").length;
  const absentCount = Array.from(localStatuses.values()).filter((s) => s === "absent").length;
  const lateCount = Array.from(localStatuses.values()).filter((s) => s === "late").length;
  const unmarkedCount = students.length - markedCount;

  const hasFilters = search || statusFilter !== "all" || sortBy !== "name-asc";

  return (
    <>
      <AppHeader
        title="Mark attendance"
        subtitle={`${date} · ${markedCount}/${students.length} marked`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={handleMarkAllPresent}
              disabled={loading || students.length === 0}
            >
              <CheckCheck className="h-4 w-4" />
              Mark all present
            </Button>
            <Button
              size="sm"
              className="gap-1"
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      />

      <div className="flex gap-3 mb-4">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={new Date().toISOString().split("T")[0]}
          className="w-[180px]"
        />
        <Select value={classFilter} onValueChange={(v) => setClassFilter(v ?? "")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((c) => (
              <SelectItem key={c} value={String(c)}>
                Class {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="unmarked">Unmarked</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name A→Z</SelectItem>
              <SelectItem value="name-desc">Name Z→A</SelectItem>
              <SelectItem value="status-asc">Present first</SelectItem>
              <SelectItem value="status-desc">Absent first</SelectItem>
              <SelectItem value="class-asc">Class low→high</SelectItem>
              <SelectItem value="class-desc">Class high→low</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStatusFilter("all"); setSortBy("name-asc"); }} className="gap-1">
              <X className="h-3 w-3" /> Clear
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-4 mb-4 text-sm">
        <span className="text-success font-medium">{presentCount} present</span>
        <span className="text-destructive font-medium">{absentCount} absent</span>
        <span className="text-warning font-medium">{lateCount} late</span>
        <span className="text-muted-foreground font-medium">{unmarkedCount} unmarked</span>
      </div>

      <AttendanceGrid
        students={filtered}
        statuses={localStatuses}
        onToggle={toggleStatus}
        loading={loading}
      />
    </>
  );
}
