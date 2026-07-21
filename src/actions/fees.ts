"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { paymentSchema, type PaymentInput } from "@/lib/validators";

export async function getFeeData(month: string) {
  const supabase = await createClient();

  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("id, full_name, class_number, board, monthly_fee")
    .eq("status", "active")
    .order("full_name", { ascending: true });

  if (studentsError) throw studentsError;

  const studentIds = students?.map((s) => s.id) ?? [];

  const { data: payments } = await supabase
    .from("fee_payments")
    .select("student_id, amount, payment_month")
    .eq("payment_month", month)
    .in("student_id", studentIds.length > 0 ? studentIds : ["00000000-0000-0000-0000-000000000000"]);

  const paymentsByStudent = new Map<string, number>();
  payments?.forEach((p) => {
    const current = paymentsByStudent.get(p.student_id) ?? 0;
    paymentsByStudent.set(p.student_id, current + Number(p.amount));
  });

  return students?.map((student) => {
    const paid = paymentsByStudent.get(student.id) ?? 0;
    const monthlyFee = Number(student.monthly_fee);
    let status: "paid" | "partial" | "unpaid" = "unpaid";
    if (paid >= monthlyFee && monthlyFee > 0) status = "paid";
    else if (paid > 0) status = "partial";

    return {
      ...student,
      monthly_fee: monthlyFee,
      paid,
      balance: monthlyFee - paid,
      status,
    };
  }) ?? [];
}

export async function recordPayment(studentId: string, month: string, input: PaymentInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Check balance to prevent overpayment
  const { data: existingPayments } = await supabase
    .from("fee_payments")
    .select("amount")
    .eq("student_id", studentId)
    .eq("payment_month", month);

  const alreadyPaid = existingPayments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

  const { data: student } = await supabase
    .from("students")
    .select("monthly_fee")
    .eq("id", studentId)
    .single();

  const monthlyFee = Number(student?.monthly_fee ?? 0);
  const balance = monthlyFee - alreadyPaid;

  if (parsed.data.amount > balance) {
    return { error: `Amount exceeds pending balance of ₹${balance.toLocaleString("en-IN")}` };
  }

  const { error } = await supabase.from("fee_payments").insert({
    student_id: studentId,
    payment_month: month,
    amount: parsed.data.amount,
    payment_date: parsed.data.payment_date,
    mode: parsed.data.mode,
    receipt_number: parsed.data.receipt_number || null,
    notes: parsed.data.notes || null,
    recorded_by: user.id,
    updated_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/fees");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getPaymentHistory(studentId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("fee_payments")
    .select("id, amount, payment_month, payment_date, mode, receipt_number, notes, created_at")
    .eq("student_id", studentId)
    .order("payment_month", { ascending: false });

  if (error) throw error;
  return data;
}

export async function deletePayment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("fee_payments").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/fees");
  revalidatePath("/dashboard");
  return { success: true };
}
