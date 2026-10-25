import React from "react";
import { requireUnAuth } from "@/lib/auth-guard";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUnAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {children}
    </div>
  );
}
