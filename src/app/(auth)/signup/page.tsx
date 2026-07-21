import { SignupForm } from "@/components/features/auth/signup-form";

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">PRC Tuition Classes</h1>
        <p className="text-sm text-muted-foreground">
          Create your admin account to get started
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
