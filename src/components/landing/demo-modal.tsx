"use client";

import * as React from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CommandIcon, XIcon, CheckCircle2Icon } from "lucide-react";

interface DemoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DemoModal({ open, onOpenChange }: DemoModalProps) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [teamSize, setTeamSize] = React.useState("10-50");
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    setSubmitted(true);
    toast.success("Demo request received! Our team will reach out within 24 hours.");
    setTimeout(() => {
      onOpenChange(false);
      setSubmitted(false);
      setName("");
      setEmail("");
      setCompany("");
    }, 2000);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-lg border-border bg-card text-card-foreground">
        <DrawerHeader className="flex flex-row items-start justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3 text-left">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CommandIcon className="size-4" />
            </div>
            <div>
              <DrawerTitle className="text-lg font-bold text-foreground">
                Request a Product Demo
              </DrawerTitle>
              <DrawerDescription className="text-xs text-muted-foreground">
                See how Utility Todo streamlines tasks and AI workflows for your team.
              </DrawerDescription>
            </div>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
              <XIcon className="size-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        {submitted ? (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2Icon className="size-6" />
            </div>
            <h4 className="text-base font-semibold text-foreground">Thank you, {name}!</h4>
            <p className="text-xs text-muted-foreground max-w-xs">
              We&apos;ve sent a confirmation email to <span className="font-medium text-foreground">{email}</span>. A product specialist will contact you shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Work Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@company.com"
                required
                className="h-10 border-border bg-secondary text-foreground placeholder:text-muted-foreground text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Full Name</label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  required
                  className="h-10 border-border bg-secondary text-foreground placeholder:text-muted-foreground text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Company Name</label>
                <Input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Corp"
                  className="h-10 border-border bg-secondary text-foreground placeholder:text-muted-foreground text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Team Size</label>
              <select
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                className="w-full h-10 rounded-md border border-border bg-secondary px-3 text-sm text-foreground outline-none"
              >
                <option value="1-10">1 - 10 people</option>
                <option value="10-50">10 - 50 people</option>
                <option value="50-250">50 - 250 people</option>
                <option value="250+">250+ enterprise</option>
              </select>
            </div>

            <DrawerFooter className="px-0 pt-3">
              <Button
                type="submit"
                className="h-10 w-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
              >
                Schedule Personalized Demo
              </Button>
            </DrawerFooter>
          </form>
        )}
      </DrawerContent>
    </Drawer>
  );
}
