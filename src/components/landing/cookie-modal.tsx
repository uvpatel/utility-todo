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
import { toast } from "sonner";
import { XIcon, CookieIcon } from "lucide-react";

interface CookieModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CookieModal({ open, onOpenChange }: CookieModalProps) {
  const [analytics, setAnalytics] = React.useState(true);
  const [marketing, setMarketing] = React.useState(false);

  const handleSave = () => {
    toast.success("Cookie preferences saved.");
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-md border-[#E9E9E7] bg-white text-[#111111]">
        <DrawerHeader className="flex flex-row items-start justify-between border-b border-[#E9E9E7] pb-4">
          <div className="flex items-center gap-2.5 text-left">
            <CookieIcon className="size-5 text-[#2383E2]" />
            <div>
              <DrawerTitle className="text-base font-bold text-[#111111]">
                Cookie Preferences
              </DrawerTitle>
              <DrawerDescription className="text-xs text-[#5F5E5B]">
                Manage how cookies and tracking tools are used.
              </DrawerDescription>
            </div>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="size-8 text-[#5F5E5B]">
              <XIcon className="size-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="p-6 space-y-4 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-[#F1F1EF]">
            <div>
              <div className="font-semibold text-[#111111]">Strictly Necessary Cookies</div>
              <div className="text-[11px] text-[#5F5E5B]">Required for authentication and session persistence.</div>
            </div>
            <span className="text-[11px] font-mono text-[#9B9A97]">Always on</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-[#F1F1EF]">
            <div>
              <div className="font-semibold text-[#111111]">Performance & Analytics</div>
              <div className="text-[11px] text-[#5F5E5B]">Helps us analyze workspace throughput and error reports.</div>
            </div>
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
              className="size-4 accent-[#2383E2]"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-semibold text-[#111111]">Marketing Preferences</div>
              <div className="text-[11px] text-[#5F5E5B]">Personalized product updates and event invites.</div>
            </div>
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
              className="size-4 accent-[#2383E2]"
            />
          </div>
        </div>

        <DrawerFooter className="border-t border-[#E9E9E7] px-6 py-3 flex-row justify-end gap-2">
          <Button
            type="button"
            onClick={handleSave}
            className="h-9 bg-[#2383E2] text-white hover:bg-[#0F6FCC] text-xs font-medium"
          >
            Save Preferences
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
