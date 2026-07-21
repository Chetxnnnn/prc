"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { sendTestMessage, getNotificationLogs, getTwilioStatus } from "@/actions/notifications";
import { MessageSquare, Phone, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    loadTwilioStatus();
    loadLogs();
  }, []);

  async function loadTwilioStatus() {
    try {
      const status = await getTwilioStatus();
      setConfigured(status.configured);
      setWhatsappNumber(status.whatsappNumber);
    } catch {
      setConfigured(false);
    }
  }

  async function loadLogs() {
    setLoadingLogs(true);
    try {
      const data = await getNotificationLogs(20);
      setLogs(data);
    } catch {
      // logs table may not exist yet
    }
    setLoadingLogs(false);
  }

  async function handleTestSend() {
    if (!phone.trim()) {
      toast.error("Enter a phone number");
      return;
    }
    setSending(true);
    const result = await sendTestMessage(phone.trim());
    setSending(false);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Test message sent!");
    }
  }

  return (
    <>
      <AppHeader
        title="Settings"
        subtitle="Manage notification and system settings"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Twilio Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              {configured ? (
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Configured
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                  <XCircle className="h-3 w-3 mr-1" />
                  Not configured
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <Label>WhatsApp number</Label>
              <p className="text-sm font-mono text-muted-foreground">
                {whatsappNumber || "Not set"}
              </p>
            </div>

            {!configured && (
              <div className="p-3 rounded-md bg-muted text-sm text-muted-foreground">
                Add your Twilio credentials to <code className="font-mono text-xs">.env.local</code> to enable notifications.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Send Test Message
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Send a test WhatsApp message to verify your Twilio setup is working correctly.
            </p>
            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="test-phone">Phone number</Label>
                <Input
                  id="test-phone"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleTestSend}
                  disabled={sending || !configured}
                  className="gap-1"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                  {sending ? "Sending..." : "Send"}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              For Twilio free trial, the number must be verified in your Twilio console first.
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent notification logs</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingLogs ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notifications sent yet.</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{log.message}</p>
                      <p className="text-xs text-muted-foreground">
                        To: {log.parent_contact} · {new Date(log.created_at).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge variant="outline" className="text-xs capitalize">
                        {log.channel}
                      </Badge>
                      {log.status === "sent" ? (
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                          Sent
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                          Failed
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
