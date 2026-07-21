"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signup } from "@/actions/auth";
import { hashPassword } from "@/lib/crypto";
import { signupSchema, type SignupInput } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export function SignupForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(data: SignupInput) {
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
    formData.set("full_name", data.full_name);
    formData.set("email", data.email);
    formData.set("password", hashedPassword);

    try {
      const result = await signup(formData);

      if (result && typeof result === "object" && "error" in result) {
        const msg = typeof result.error === "string"
          ? result.error
          : "An unexpected error occurred.";
        toast.error(msg);
        setLoading(false);
        return;
      }
    } catch (e: unknown) {
      if (
        e &&
        typeof e === "object" &&
        "digest" in e &&
        typeof (e as { digest: string }).digest === "string" &&
        (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")
      ) {
        router.push("/pending");
        return;
      }
      const msg = e instanceof Error ? e.message : "An unexpected error occurred.";
      toast.error(msg);
      setLoading(false);
      return;
    }

    router.push("/pending");
  }

  return (
    <Card>
      <CardContent>
        <div className="text-center mb-4">
          <h1 className="text-lg font-semibold">Staff Registration</h1>
          <p className="text-sm text-muted-foreground">Admin &amp; Teacher portal</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="full_name"
              placeholder="Admin User"
              disabled={loading}
              {...register("full_name")}
            />
            {errors.full_name && (
              <p className="text-sm text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              disabled={loading}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password <span className="text-destructive">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              disabled={loading}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>

        <div className="mt-3 pt-3 border-t text-center text-sm">
          <span className="text-muted-foreground">Are you a student? </span>
          <Link href="/student/signup" className="text-primary hover:underline">
            Student registration
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
