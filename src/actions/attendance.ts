"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendBulkAttendanceNotifications } from "@/actions/notifications";
import type { Database } from "@/types/database.types";

type AttendanceStatus = Database["public"]["Enums"]["attendance_status"];

export async function getAttendanceForDate(date: string, classNumber?: number) {
  const supabase = await createClient();

  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("id, full_name, class_number, board")
    .eq("status", "active")
    .order("full_name", { ascending: true });

  if (studentsError) throw studentsError;

  type StudentRow = Database["public"]["Tables"]["students"]["Row"];
  let filtered: Pick<StudentRow, "id" | "full_name" | "class_number" | "board">[] = (students ?? []) as Pick<StudentRow, "id" | "full_name" | "class_number" | "board">[];
  if (classNumber) {
    filtered = filtered.filter((s) => s.class_number === classNumber);
  }

  const studentIds = filtered.map((s) => s.id);

  const { data: attendance } = studentIds.length > 0
    ? await supabase
        .from("attendance")
        .select("student_id, status")
        .eq("attendance_date", date)
        .in("student_id", studentIds)
    : { data: [] as { student_id: string; status: AttendanceStatus }[] };

  const attendanceMap = new Map<string, AttendanceStatus>();
  (attendance ?? []).forEach((a) => {
    attendanceMap.set(a.student_id, a.status);
  });

  return filtered.map((student) => ({
    ...student,
    status: attendanceMap.get(student.id) ?? null,
  }));
}

export async function markAttendance(
  date: string,
  entries: { student_id: string; status: AttendanceStatus }[]
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  for (const entry of entries) {
    const { error } = await supabase
      .from("attendance")
      .upsert(
        {
          student_id: entry.student_id,
          attendance_date: date,
          status: entry.status,
          marked_by: user.id,
          updated_by: user.id,
        },
        { onConflict: "student_id,attendance_date" }
      );

    if (error) return { error: error.message };
  }

  revalidatePath("/attendance");
  revalidatePath("/dashboard");

  // Send notifications in background (fire-and-forget)
  const studentIds = entries.map((e) => e.student_id);
  const statusMap = new Map(entries.map((e) => [e.student_id, e.status]));

  supabase
    .from("students")
    .select("id, full_name, parent_contact, class_number, send_notifications")
    .in("id", studentIds)
    .then(({ data: students }) => {
      if (!students) return;
      const notifEntries = students
        .filter((s) => s.send_notifications && s.parent_contact && statusMap.has(s.id))
        .map((s) => ({
          student_id: s.id,
          student_name: s.full_name,
          parent_contact: s.parent_contact,
          class_number: s.class_number,
          status: statusMap.get(s.id)!,
        }));
      if (notifEntries.length > 0) {
        sendBulkAttendanceNotifications(notifEntries, date).catch(() => {});
      }
    });

  return { success: true };
}

export async function markAllPresent(date: string, studentIds: string[]) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const entries = studentIds.map((student_id) => ({
    student_id,
    attendance_date: date,
    status: "present" as const,
    marked_by: user.id,
    updated_by: user.id,
  }));

  const { error } = await supabase
    .from("attendance")
    .upsert(entries, { onConflict: "student_id,attendance_date" });

  if (error) return { error: error.message };

  revalidatePath("/attendance");
  revalidatePath("/dashboard");

  // Send notifications in background (fire-and-forget)
  supabase
    .from("students")
    .select("id, full_name, parent_contact, class_number, send_notifications")
    .in("id", studentIds)
    .then(({ data: students }) => {
      if (!students) return;
      const notifEntries = students
        .filter((s) => s.send_notifications && s.parent_contact)
        .map((s) => ({
          student_id: s.id,
          student_name: s.full_name,
          parent_contact: s.parent_contact,
          class_number: s.class_number,
          status: "present" as const,
        }));
      if (notifEntries.length > 0) {
        sendBulkAttendanceNotifications(notifEntries, date).catch(() => {});
      }
    });

  return { success: true };
}
