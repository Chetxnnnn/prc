"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { studentSignup } from "@/actions/student-auth";
import { studentSignupSchema, type StudentSignupInput, ALL_SUBJECTS } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

function toggleSubject(current: string[], value: string): string[] {
  return current.includes(value) ? current.filter((s) => s !== value) : [...current, value];
}

export function StudentSignupForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StudentSignupInput>({
    resolver: zodResolver(studentSignupSchema),
    defaultValues: { subjects: [] },
  });

  const selectedSubjects = watch("subjects");

  async function onSubmit(data: StudentSignupInput) {
    setLoading(true);
    const formData = new FormData();
    formData.set("email", data.email);
    formData.set("password", data.password);
    formData.set("full_name", data.full_name);
    formData.set("date_of_birth", data.date_of_birth);
    formData.set("gender", data.gender);
    formData.set("contact_number", data.contact_number);
    formData.set("parent_name", data.parent_name);
    formData.set("parent_contact", data.parent_contact);
    if (data.address) formData.set("address", data.address);
    formData.set("board", data.board);
    formData.set("class_number", String(data.class_number));
    data.subjects.forEach((s) => formData.append("subjects", s));

    try {
      const result = await studentSignup(formData);
      if (result && typeof result === "object" && "error" in result) {
        toast.error(String(result.error));
        setLoading(false);
        return;
      }
    } catch (e: unknown) {
      if (e && typeof e === "object" && "digest" in e && typeof (e as { digest: string }).digest === "string" && (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")) {
        router.push("/student/pending");
        return;
      }
      toast.error(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
      return;
    }
    router.push("/student/pending");
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <h1 className="text-lg font-semibold text-center">Student Registration</h1>
          <p className="text-sm text-muted-foreground text-center">Create your student account</p>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name <span className="text-destructive">*</span></Label>
            <Input id="full_name" placeholder="Your full name" disabled={loading} {...register("full_name")} />
            {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
            <Input id="email" type="email" placeholder="you@example.com" disabled={loading} {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
            <Input id="password" type="password" placeholder="At least 6 characters" disabled={loading} {...register("password")} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth <span className="text-destructive">*</span></Label>
              <Input id="date_of_birth" type="date" max={new Date().toISOString().split("T")[0]} disabled={loading} {...register("date_of_birth")} />
              {errors.date_of_birth && <p className="text-sm text-destructive">{errors.date_of_birth.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Gender <span className="text-destructive">*</span></Label>
              <Select onValueChange={(v) => setValue("gender", v as "male" | "female")}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_number">Contact Number <span className="text-destructive">*</span></Label>
            <Input id="contact_number" placeholder="10-digit phone number" disabled={loading} {...register("contact_number")} />
            {errors.contact_number && <p className="text-sm text-destructive">{errors.contact_number.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parent_name">Parent Name <span className="text-destructive">*</span></Label>
              <Input id="parent_name" placeholder="Parent name" disabled={loading} {...register("parent_name")} />
              {errors.parent_name && <p className="text-sm text-destructive">{errors.parent_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent_contact">Parent Contact <span className="text-destructive">*</span></Label>
              <Input id="parent_contact" placeholder="10-digit phone" disabled={loading} {...register("parent_contact")} />
              {errors.parent_contact && <p className="text-sm text-destructive">{errors.parent_contact.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" placeholder="Optional" disabled={loading} {...register("address")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="school_name">School name</Label>
              <Input id="school_name" placeholder="Current school" disabled={loading} {...register("school_name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="previous_academic_performance">Previous year % / CGPA</Label>
              <Input id="previous_academic_performance" placeholder="e.g. 85% or 9.2" disabled={loading} {...register("previous_academic_performance")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Board <span className="text-destructive">*</span></Label>
              <Select onValueChange={(v) => setValue("board", v as "cbse" | "icse" | "state")}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cbse">CBSE</SelectItem>
                  <SelectItem value="icse">ICSE</SelectItem>
                  <SelectItem value="state">State</SelectItem>
                </SelectContent>
              </Select>
              {errors.board && <p className="text-sm text-destructive">{errors.board.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Class <span className="text-destructive">*</span></Label>
              <Select onValueChange={(v) => setValue("class_number", Number(v))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>Class {i + 1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.class_number && <p className="text-sm text-destructive">{errors.class_number.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Subjects <span className="text-destructive">*</span></Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
              {ALL_SUBJECTS.map((subject) => (
                <label key={subject} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSubjects.includes(subject)}
                    onChange={() => {
                      const updated = toggleSubject(selectedSubjects, subject);
                      setValue("subjects", updated, { shouldValidate: true });
                    }}
                    className="rounded"
                  />
                  {subject}
                </label>
              ))}
            </div>
            {errors.subjects && <p className="text-sm text-destructive">{errors.subjects.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Register as Student"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/student/login" className="text-primary hover:underline">Sign in</Link>
        </div>
        <div className="mt-3 pt-3 border-t text-center text-sm">
          <span className="text-muted-foreground">Are you a staff member? </span>
          <Link href="/login" className="text-primary hover:underline">Staff login</Link>
        </div>
      </CardContent>
    </Card>
  );
}
