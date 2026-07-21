import { LoginForm } from "@/components/features/auth/login-form";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">PRC Tuition Classes</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your admin account
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
