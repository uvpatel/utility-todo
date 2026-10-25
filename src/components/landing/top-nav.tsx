"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronDownIcon,
  MenuIcon,
  XIcon,
  CommandIcon,
  SparklesIcon,
  FolderKanbanIcon,
  CalendarCheckIcon,
  UsersIcon,
  BookOpenIcon,
  HelpCircleIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { DemoModal } from "./demo-modal";
import { ThemeToggle } from "@/components/theme-toggle";

export function TopNav() {
  const { data: session } = authClient.useSession();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);
  const [isDemoModalOpen, setIsDemoModalOpen] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-50 flex h-14 w-full items-center justify-between px-4 transition-all duration-200 sm:px-8 md:px-12 ${
          isScrolled
            ? "border-b border-border bg-background/95 backdrop-blur-md shadow-xs"
            : "border-b border-transparent bg-background"
        }`}
      >
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 text-foreground">
            <div className="flex size-7 items-center justify-center rounded-lg bg-foreground text-background">
              <CommandIcon className="size-4" />
            </div>
            <span className="font-semibold tracking-tight text-base text-foreground">
              Utility Todo
            </span>
          </Link>

          {/* Center: Desktop Navigation items with dropdowns */}
          <nav className="hidden items-center gap-1 md:flex">
            {/* Product Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown("product")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                type="button"
                className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                <span>Product</span>
                <ChevronDownIcon className="size-3.5 opacity-60" />
              </button>

              {activeDropdown === "product" && (
                <div className="absolute left-0 top-full w-64 rounded-xl border border-border bg-popover p-2 shadow-xl animate-in fade-in-50 duration-150 text-popover-foreground">
                  <Link
                    href="/todo"
                    className="flex items-start gap-2.5 rounded-lg p-2 hover:bg-secondary transition-colors"
                  >
                    <FolderKanbanIcon className="size-4 text-primary mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-foreground">Task Workspace</div>
                      <div className="text-[11px] text-muted-foreground">PostgreSQL backed task organization</div>
                    </div>
                  </Link>
                  <Link
                    href="/dashboard"
                    className="flex items-start gap-2.5 rounded-lg p-2 hover:bg-secondary transition-colors"
                  >
                    <SparklesIcon className="size-4 text-emerald-500 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-foreground">Analytics & Throughput</div>
                      <div className="text-[11px] text-muted-foreground">Live metrics and completion rates</div>
                    </div>
                  </Link>
                  <Link
                    href="/todo"
                    className="flex items-start gap-2.5 rounded-lg p-2 hover:bg-secondary transition-colors"
                  >
                    <CalendarCheckIcon className="size-4 text-amber-500 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-foreground">My Day Focus</div>
                      <div className="text-[11px] text-muted-foreground">Curated daily workflow execution</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Resources Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown("resources")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                type="button"
                className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                <span>Resources</span>
                <ChevronDownIcon className="size-3.5 opacity-60" />
              </button>

              {activeDropdown === "resources" && (
                <div className="absolute left-0 top-full w-60 rounded-xl border border-border bg-popover p-2 shadow-xl animate-in fade-in-50 duration-150 text-popover-foreground">
                  <a
                    href="#features"
                    className="flex items-center gap-2.5 rounded-lg p-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    <BookOpenIcon className="size-4 text-muted-foreground" />
                    Product Documentation
                  </a>
                  <a
                    href="#testimonials"
                    className="flex items-center gap-2.5 rounded-lg p-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    <UsersIcon className="size-4 text-muted-foreground" />
                    Customer Stories
                  </a>
                  <a
                    href="#faq"
                    className="flex items-center gap-2.5 rounded-lg p-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    <HelpCircleIcon className="size-4 text-muted-foreground" />
                    Help & FAQs
                  </a>
                  <a
                    href="#security"
                    className="flex items-center gap-2.5 rounded-lg p-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    <ShieldCheckIcon className="size-4 text-muted-foreground" />
                    Security & Compliance
                  </a>
                </div>
              )}
            </div>

            <a
              href="#pricing"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Pricing
            </a>

            <button
              type="button"
              onClick={() => setIsDemoModalOpen(true)}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              Request a demo
            </button>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="hidden items-center gap-3 sm:flex">
          <ThemeToggle />

          {session ? (
            <Link
              href="/todo"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>{session.user.name || "Workspace"}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              Log in
            </Link>
          )}

          <Link
            href="/todo"
            className="flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
          >
            Open app
          </Link>
        </div>

        {/* Mobile menu button & Theme toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex size-9 items-center justify-center rounded-md text-foreground hover:bg-secondary cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Sheet */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-14 z-50 flex flex-col bg-background p-6 md:hidden animate-in fade-in duration-150">
          <nav className="flex flex-col gap-4 text-base font-medium text-foreground">
            <Link
              href="/todo"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between py-2 border-b border-border"
            >
              <span>Task Workspace</span>
              <ArrowRightIcon className="size-4 text-muted-foreground" />
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between py-2 border-b border-border"
            >
              <span>Dashboard & Analytics</span>
              <ArrowRightIcon className="size-4 text-muted-foreground" />
            </Link>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsDemoModalOpen(true);
              }}
              className="flex items-center justify-between py-2 border-b border-border text-left cursor-pointer"
            >
              <span>Request a demo</span>
              <ArrowRightIcon className="size-4 text-muted-foreground" />
            </button>
          </nav>

          <div className="mt-auto flex flex-col gap-3 pt-6">
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex h-11 w-full items-center justify-center rounded-lg border border-border bg-card text-sm font-medium text-foreground"
            >
              Log in
            </Link>
            <Link
              href="/todo"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-sm"
            >
              Open app
            </Link>
          </div>
        </div>
      )}

      {/* Request a demo modal */}
      <DemoModal open={isDemoModalOpen} onOpenChange={setIsDemoModalOpen} />
    </>
  );
}
