import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, TriangleAlert } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";

const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
  displayName: z.string().optional(),
});

const signupSchema = loginSchema.extend({
  displayName: z.string().min(2, "Tell us your name"),
});

type FormValues = z.infer<typeof loginSchema>;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="currentColor"
        d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81"
      />
    </svg>
  );
}

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [submitting, setSubmitting] = useState(false);
  const { session, loading, signInWithPassword, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(mode === "login" ? loginSchema : signupSchema),
    defaultValues: { email: "", password: "", displayName: "" },
  });

  if (!loading && session) return <Navigate to="/app" replace />;

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      if (mode === "login") {
        const { error } = await signInWithPassword(values.email, values.password);
        if (error) {
          toast.error(error);
          return;
        }
        navigate("/app");
      } else {
        const { error } = await signUp(
          values.email,
          values.password,
          values.displayName ?? "",
        );
        if (error) {
          toast.error(error);
          return;
        }
        toast.success("Account created. Check your inbox to confirm your email.");
        setMode("login");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grain vault-gradient flex min-h-svh flex-col items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <Link to="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>

        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-xl">
              {mode === "login" ? "Open the vault" : "Claim your vault"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Sign in to your collection"
                : "Create an account to start cataloguing"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isSupabaseConfigured && (
              <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                <span>
                  Supabase isn't configured yet — copy{" "}
                  <code className="font-mono text-xs">.env.example</code> to{" "}
                  <code className="font-mono text-xs">.env.local</code> and fill
                  in your project keys.
                </span>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              disabled={!isSupabaseConfigured || submitting}
              onClick={async () => {
                const { error } = await signInWithGoogle();
                if (error) toast.error(error);
              }}
            >
              <GoogleIcon />
              Continue with Google
            </Button>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or</span>
              <Separator className="flex-1" />
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="displayName">Name</Label>
                  <Input
                    id="displayName"
                    placeholder="Hassan Shahzad"
                    autoComplete="name"
                    {...form.register("displayName")}
                  />
                  {form.formState.errors.displayName && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.displayName.message}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!isSupabaseConfigured || submitting}
              >
                {submitting && <Loader2 className="animate-spin" />}
                {mode === "login" ? "Sign in" : "Create account"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              {mode === "login" ? "No account yet?" : "Already have an account?"}{" "}
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
