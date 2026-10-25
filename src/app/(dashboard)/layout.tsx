import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TaskDetailsDrawer } from "@/components/task-details-drawer";
import { CommandPalette } from "@/components/command-palette";
import { requireAuth } from "@/lib/auth-guard";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <div className="notion-workspace min-h-screen bg-background text-foreground transition-colors duration-200">
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 64)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset className="bg-background">
          <SiteHeader />
          {children}
        </SidebarInset>
        <TaskDetailsDrawer />
        <CommandPalette />
      </SidebarProvider>
    </div>
  );
}
