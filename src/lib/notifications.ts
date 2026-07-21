import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER;

function getClient() {
  if (!accountSid || !authToken) return null;
  return twilio(accountSid, authToken);
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("+")) return digits;
  return `+91${digits}`;
}

export interface SendResult {
  channel: "whatsapp";
  status: "sent" | "failed";
  sid?: string;
  error?: string;
}

export async function sendWhatsApp(to: string, body: string): Promise<SendResult> {
  const client = getClient();
  if (!client) return { channel: "whatsapp", status: "failed", error: "Twilio not configured" };
  if (!whatsappFrom) return { channel: "whatsapp", status: "failed", error: "WhatsApp number not configured" };

  try {
    const message = await client.messages.create({
      from: `whatsapp:${whatsappFrom}`,
      to: `whatsapp:${formatPhone(to)}`,
      body,
    });
    return { channel: "whatsapp", status: "sent", sid: message.sid };
  } catch (e) {
    return { channel: "whatsapp", status: "failed", error: String(e) };
  }
}

const statusLabels: Record<string, string> = {
  present: "present today",
  absent: "absent today",
  late: "late today",
};

export function buildAttendanceMessage(
  studentName: string,
  status: string,
  date: string,
  classNumber: number
): string {
  const label = statusLabels[status] ?? status;
  const formattedDate = new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `PRC Tuitions: ${studentName} was ${label} (${formattedDate}). Class ${classNumber}.`;
}

export async function sendAttendanceNotification(
  parentContact: string,
  studentName: string,
  status: string,
  date: string,
  classNumber: number
): Promise<SendResult> {
  const message = buildAttendanceMessage(studentName, status, date, classNumber);
  return sendWhatsApp(parentContact, message);
}
