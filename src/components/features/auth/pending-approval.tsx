"use client";

import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

export function PendingApproval({ name, status }: { name: string; status: "pending" | "inactive" }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6 space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <h1 className="text-lg font-semibold">
              {status === "pending" ? "Account Pending Approval" : "Account Inactive"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {status === "pending"
                ? `Hi ${name}, your account is waiting for admin approval. You'll be able to access the portal once an admin approves your account.`
                : `Hi ${name}, your account has been deactivated. Please contact an admin to regain access.`}
            </p>
          </div>

          <form action={logout}>
            <Button type="submit" variant="destructive" className="w-full">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
