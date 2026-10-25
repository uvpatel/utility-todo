import React from "react";
import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <ArrowLeftIcon className="size-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
