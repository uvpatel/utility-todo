"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CommandIcon, Loader2, GitBranchPlus } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      if (mode === "signup") {
        const res = await authClient.signUp.email({
          email,
          password,
          name: name.trim() || email.split("@")[0],
          callbackURL: "/todo",
        });

        if (res.error) {
          setErrorMessage(res.error.message || "Failed to sign up");
          toast.error(res.error.message || "Failed to sign up");
        } else {
          toast.success("Account created successfully!");
          router.push("/todo");
          router.refresh();
        }
      } else {
        const res = await authClient.signIn.email({
          email,
          password,
          callbackURL: "/todo",
        });

        if (res.error) {
          setErrorMessage(res.error.message || "Invalid email or password");
          toast.error(res.error.message || "Invalid email or password");
        } else {
          toast.success("Logged in successfully!");
          router.push("/todo");
          router.refresh();
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication error";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
              <CommandIcon className="size-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Utility Todo</h1>
            <FieldDescription>
              {mode === "signin"
                ? "Sign in to access your task workspace"
                : "Create an account to start organizing your work"}
            </FieldDescription>
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              {errorMessage}
            </div>
          )}

          {mode === "signup" && (
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                required
              />
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              required
            />
          </Field>

          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Password</FieldLabel>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </Field>

          <Field>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {mode === "signin" ? "Sign In" : "Create Account"}
            </Button>
          </Field>

          <div className="text-center text-xs text-muted-foreground">
            {mode === "signin" ? (
              <span>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setErrorMessage("");
                  }}
                  className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
                >
                  Sign up
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setErrorMessage("");
                  }}
                  className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
                >
                  Sign in
                </button>
              </span>
            )}
          </div>

          <FieldSeparator>Or</FieldSeparator>

          <Field className="grid grid-cols-1 gap-4">
            <Button
              variant="outline"
              type="button"
              className="w-full"
              disabled={isGithubLoading}
              onClick={async () => {
                setIsGithubLoading(true);
                try {
                  await authClient.signIn.social({
                    provider: "github",
                    callbackURL: "/todo",
                  });
                } finally {
                  setIsGithubLoading(false);
                }
              }}
            >
              {isGithubLoading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <GitBranchPlus className="mr-2 size-4" />
              )}
              Continue with GitHub
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center text-xs text-muted-foreground">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </FieldDescription>
    </div>
  );
}
