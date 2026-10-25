"use client";

import * as React from "react";
import Link from "next/link";
import { DemoModal } from "./demo-modal";

export function FinalCTA() {
  const [isDemoModalOpen, setIsDemoModalOpen] = React.useState(false);

  return (
    <section className="w-full bg-[#F7F7F5] border-t border-[#E9E9E7] py-20 px-4 text-center sm:px-6 md:py-28">
      <div className="mx-auto max-w-xl space-y-6">
        <h2 className="text-4xl font-extrabold tracking-tight text-[#111111] sm:text-5xl">
          Get started today.
        </h2>

        <div className="flex flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/login"
            className="flex h-10 items-center justify-center rounded-md bg-[#2383E2] px-5 text-sm font-medium text-white shadow-xs hover:bg-[#0F6FCC] transition-colors"
          >
            Get started free
          </Link>
          <button
            type="button"
            onClick={() => setIsDemoModalOpen(true)}
            className="flex h-10 items-center justify-center rounded-md bg-[#E3F0FD] px-5 text-sm font-medium text-[#2383E2] hover:bg-[#d6e9fc] transition-colors cursor-pointer"
          >
            Request a demo
          </button>
        </div>
      </div>

      <DemoModal open={isDemoModalOpen} onOpenChange={setIsDemoModalOpen} />
    </section>
  );
}
