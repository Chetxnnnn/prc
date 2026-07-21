"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { login } from "@/actions/auth";
import { hashPassword } from "@/lib/crypto";
import { loginSchema, type LoginInput } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export function StudentLoginForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setLoading(true);

    let hashedPassword: string;
    try {
      hashedPassword = await hashPassword(data.password);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to secure password.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.set("email", data.email);
    formData.set("password", hashedPassword);

    try {
      const result = await login(formData);
      if (result && typeof result === "object" && "error" in result) {
        toast.error(String(result.error));
        setLoading(false);
        return;
      }
    } catch (e: unknown) {
      if (e && typeof e === "object" && "digest" in e && typeof (e as { digest: string }).digest === "string" && (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")) {
        router.push("/student/dashboard");
        return;
      }
      toast.error(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
      return;
    }
    router.push("/student/dashboard");
  }

  return (
    <Card>
      <CardContent>
        <div className="text-center mb-4">
          <h1 className="text-lg font-semibold">Student Login</h1>
          <p className="text-sm text-muted-foreground">View your profile &amp; attendance</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" disabled={loading} {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Your password" disabled={loading} {...register("password")} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/student/signup" className="text-primary hover:underline">Register as student</Link>
        </div>
        <div className="mt-3 pt-3 border-t text-center text-sm">
          <span className="text-muted-foreground">Are you a staff member? </span>
          <Link href="/login" className="text-primary hover:underline">Staff login</Link>
        </div>
      </CardContent>
    </Card>
  );
}
