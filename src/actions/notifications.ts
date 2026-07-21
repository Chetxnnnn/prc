"use server";

import { createClient } from "@/lib/supabase/server";
import { sendAttendanceNotification, sendWhatsApp } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

function isTwilioConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_NUMBER
  );
}

export async function getTwilioStatus() {
  const configured = !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_NUMBER
  );
  return {
    configured,
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || "",
  };
}

export async function sendTestMessage(phoneNumber: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!isTwilioConfigured()) {
    return { error: "Twilio is not configured. Add your credentials to .env.local." };
  }

  const result = await sendWhatsApp(
    phoneNumber,
    "PRC Tuitions: This is a test message. Your notifications are working!"
  );

  if (result.status === "failed") {
    return { error: result.error ?? "Failed to send message" };
  }

  return { success: true, sid: result.sid };
}

export async function sendBulkAttendanceNotifications(
  entries: { student_id: string; student_name: string; parent_contact: string; class_number: number; status: string }[],
  date: string
) {
  if (!isTwilioConfigured()) {
    return { sent: 0, failed: 0, error: "Twilio not configured" };
  }

  const supabase = await createClient();
  let sent = 0;
  let failed = 0;

  for (const entry of entries) {
    if (!entry.parent_contact) {
      failed++;
      continue;
    }

    const result = await sendAttendanceNotification(
      entry.parent_contact,
      entry.student_name,
      entry.status,
      date,
      entry.class_number
    );

    if (result.status === "sent") {
      sent++;
    } else {
      failed++;
    }

    await supabase.from("notification_logs").insert({
      student_id: entry.student_id,
      channel: "whatsapp",
      status: result.status,
      parent_contact: entry.parent_contact,
      message: `Attendance: ${entry.student_name} was ${entry.status} on ${date}`,
      error: result.status === "failed" ? result.error : null,
    });
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { sent, failed };
}

export async function getNotificationLogs(limit = 50) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("notification_logs")
    .select("*, students(full_name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function toggleStudentNotifications(studentId: string, enabled: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("students")
    .update({ send_notifications: enabled })
    .eq("id", studentId);

  if (error) return { error: error.message };

  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  return { success: true };
}
