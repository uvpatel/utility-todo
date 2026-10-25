"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarCheckIcon,
  CheckCircle2Icon,
  FolderKanbanIcon,
  SparklesIcon,
} from "lucide-react";
import { DemoModal } from "./demo-modal";

export function Hero() {
  const [isDemoModalOpen, setIsDemoModalOpen] = React.useState(false);

  return (
    <section className="relative flex flex-col items-center px-4 pt-16 pb-12 sm:px-6 md:pt-24 md:pb-20">
      {/* Centered Oversized H1 */}
      <div className="max-w-4xl text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-[#111111] sm:text-6xl md:text-7xl lg:text-[84px] leading-[1.05]">
          Where teams and <br className="hidden sm:inline" />
          tasks{" "}
          <span className="inline-flex items-center gap-2 rounded-full bg-[#E3F0FD] px-4 py-1 align-middle text-[#111111]">
            <span className="size-3.5 rounded-full bg-[#2383E2]" />
            <span className="text-[#111111]">Think</span>
          </span>{" "}
          together.
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg text-[#5F5E5B] leading-relaxed">
          Capture context, find answers, and automate tasks with an intelligent workspace built for your team.
        </p>

        {/* Buttons */}
        <div className="mt-8 flex flex-row items-center justify-center gap-3">
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

      {/* Large Product Mockup with Overlapping Hand-drawn Doodles */}
      <div className="relative mt-12 w-full max-w-5xl md:mt-16">
        {/* Left hand-drawn character doodle */}
        <div className="absolute -left-8 top-1/3 z-20 hidden -translate-y-1/2 select-none md:block">
          <svg width="64" height="110" viewBox="0 0 64 110" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M32 18C39.732 18 46 12.6274 46 6C46 -0.627417 39.732 -6 32 -6C24.268 -6 18 -0.627417 18 6C18 12.6274 24.268 18 32 18Z"
              stroke="#111111"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M28 18C28 35 22 55 12 75C22 75 35 70 42 62C45 75 48 95 52 108"
              stroke="#111111"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M16 35C24 38 40 40 48 30"
              stroke="#111111"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="28" cy="6" r="1.5" fill="#111111" />
            <circle cx="36" cy="6" r="1.5" fill="#111111" />
            <path d="M30 11C32 12 34 12 36 11" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Right hand-drawn face doodle */}
        <div className="absolute -right-4 -top-8 z-20 select-none hidden sm:block">
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="36" cy="36" r="30" stroke="#111111" strokeWidth="2.5" />
            <path d="M26 28C28 26 31 26 33 28" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M41 28C43 26 46 26 48 28" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="30" cy="32" r="2" fill="#111111" />
            <circle cx="45" cy="32" r="2" fill="#111111" />
            <path d="M38 35V42L35 44" stroke="#111111" strokeWidth="2" strokeLinecap="round" />
            <path d="M30 50C34 53 40 53 44 50" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Browser Mockup Frame */}
        <div className="overflow-hidden rounded-2xl border border-[#E9E9E7] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)]">
          {/* Browser Window Bar */}
          <div className="flex h-10 items-center justify-between border-b border-[#E9E9E7] bg-[#F7F7F5] px-4">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-[#E5533D]/80" />
              <span className="size-2.5 rounded-full bg-[#E8A21C]/80" />
              <span className="size-2.5 rounded-full bg-[#2A9D8F]/80" />
              <span className="ml-2 text-xs font-medium text-[#5F5E5B]">Utility Todo — Workspace</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#9B9A97]">
              <span className="rounded bg-white px-2 py-0.5 border border-[#E9E9E7]">Share</span>
              <span className="rounded bg-white px-2 py-0.5 border border-[#E9E9E7]">⚡ AI Active</span>
            </div>
          </div>

          {/* Inner Workspace Layout */}
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] bg-white min-h-[460px]">
            {/* Sidebar Mockup */}
            <div className="hidden md:flex flex-col border-r border-[#E9E9E7] bg-[#FBFBFA] p-3 text-xs text-[#5F5E5B]">
              <div className="flex items-center gap-2 px-2 py-1 font-semibold text-[#111111]">
                <FolderKanbanIcon className="size-4 text-[#2383E2]" />
                <span>Ramp HQ Sprint</span>
              </div>

              <div className="mt-4 space-y-1">
                <div className="px-2 text-[10px] uppercase font-bold text-[#9B9A97]">Views</div>
                <div className="flex items-center gap-2 rounded-md bg-[#F1F1EF] px-2 py-1.5 font-medium text-[#111111]">
                  <FolderKanbanIcon className="size-3.5" />
                  <span>Tasks Board</span>
                </div>
                <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[#F7F7F5]">
                  <CalendarCheckIcon className="size-3.5" />
                  <span>My Day</span>
                </div>
                <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[#F7F7F5]">
                  <SparklesIcon className="size-3.5 text-[#2383E2]" />
                  <span>AI Workflows</span>
                </div>
              </div>

              <div className="mt-6 space-y-1">
                <div className="px-2 text-[10px] uppercase font-bold text-[#9B9A97]">Projects</div>
                <div className="flex items-center gap-2 px-2 py-1">
                  <span className="size-2 rounded-full bg-[#2383E2]" />
                  <span>Engineering</span>
                </div>
                <div className="flex items-center gap-2 px-2 py-1">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span>Design System</span>
                </div>
                <div className="flex items-center gap-2 px-2 py-1">
                  <span className="size-2 rounded-full bg-amber-500" />
                  <span>Growth & Marketing</span>
                </div>
              </div>

              <div className="mt-auto rounded-lg border border-[#E9E9E7] bg-white p-2">
                <div className="flex items-center gap-2 text-[11px] font-medium text-[#111111]">
                  <SparklesIcon className="size-3.5 text-[#2383E2]" />
                  <span>Assistant: Active</span>
                </div>
                <p className="text-[10px] text-[#9B9A97] mt-0.5">3 tasks auto-routed</p>
              </div>
            </div>

            {/* Kanban Columns */}
            <div className="p-4 sm:p-6 overflow-x-auto">
              <div className="flex items-center justify-between pb-4 border-b border-[#E9E9E7]">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-bold text-[#111111]">Sprint Backlog & AI Tasks</h3>
                  <span className="rounded-full bg-[#E3F0FD] px-2.5 py-0.5 text-xs font-semibold text-[#2383E2]">
                    52 Total
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#5F5E5B]">Sort: Priority</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 min-w-[680px]">
                {/* Column 1: To-do */}
                <div className="rounded-xl border border-[#E9E9E7] bg-[#F7F7F5] p-2.5 space-y-2">
                  <div className="flex items-center justify-between px-1 text-xs font-semibold text-[#5F5E5B]">
                    <span>To-do</span>
                    <span className="rounded bg-white px-1.5 py-0.2 border border-[#E9E9E7] text-[10px]">10</span>
                  </div>

                  <div className="rounded-lg border border-[#E9E9E7] bg-white p-2.5 shadow-xs space-y-1.5">
                    <div className="text-xs font-medium text-[#111111]">Update help center documentation</div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="rounded bg-[#FDECC8] text-amber-800 px-1 py-0.2">Medium</span>
                      <span className="text-[#9B9A97]">Oct 28</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#E9E9E7] bg-white p-2.5 shadow-xs space-y-1.5">
                    <div className="text-xs font-medium text-[#111111]">Review campaign creative assets</div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="rounded bg-[#F5E0E9] text-rose-800 px-1 py-0.2">High</span>
                      <span className="text-[#9B9A97]">Tomorrow</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#E9E9E7] bg-white p-2.5 shadow-xs space-y-1.5">
                    <div className="text-xs font-medium text-[#111111]">Customer case studies interview</div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="rounded bg-[#D3E5EF] text-blue-800 px-1 py-0.2">Growth</span>
                    </div>
                  </div>
                </div>

                {/* Column 2: In progress */}
                <div className="rounded-xl border border-[#E9E9E7] bg-[#F7F7F5] p-2.5 space-y-2">
                  <div className="flex items-center justify-between px-1 text-xs font-semibold text-[#5F5E5B]">
                    <span>In progress</span>
                    <span className="rounded bg-white px-1.5 py-0.2 border border-[#E9E9E7] text-[10px]">5</span>
                  </div>

                  <div className="rounded-lg border border-[#E9E9E7] bg-white p-2.5 shadow-xs space-y-1.5">
                    <div className="text-xs font-medium text-[#111111]">Sales demo sync & walkthrough</div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="rounded bg-[#DBEDDB] text-emerald-800 px-1 py-0.2">Design</span>
                      <span className="text-[#9B9A97]">Today</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#E9E9E7] bg-white p-2.5 shadow-xs space-y-1.5">
                    <div className="text-xs font-medium text-[#111111]">Launch beta demo video preview</div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="rounded bg-[#F5E0E9] text-rose-800 px-1 py-0.2">Urgent</span>
                      <span className="text-[#9B9A97]">Oct 26</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#E9E9E7] bg-white p-2.5 shadow-xs space-y-1.5">
                    <div className="text-xs font-medium text-[#111111]">Respond to user beta questions</div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="rounded bg-[#E3F0FD] text-[#2383E2] px-1 py-0.2">Support</span>
                    </div>
                  </div>
                </div>

                {/* Column 3: In review */}
                <div className="rounded-xl border border-[#E9E9E7] bg-[#F7F7F5] p-2.5 space-y-2">
                  <div className="flex items-center justify-between px-1 text-xs font-semibold text-[#5F5E5B]">
                    <span>In review</span>
                    <span className="rounded bg-white px-1.5 py-0.2 border border-[#E9E9E7] text-[10px]">3</span>
                  </div>

                  <div className="rounded-lg border border-[#E9E9E7] bg-white p-2.5 shadow-xs space-y-1.5">
                    <div className="text-xs font-medium text-[#111111]">Weekly sales status report</div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="rounded bg-[#D3E5EF] text-blue-800 px-1 py-0.2">Review</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#E9E9E7] bg-white p-2.5 shadow-xs space-y-1.5">
                    <div className="text-xs font-medium text-[#111111]">Marketing campaign visual assets</div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="rounded bg-[#FDECC8] text-amber-800 px-1 py-0.2">Pending</span>
                    </div>
                  </div>
                </div>

                {/* Column 4: Complete */}
                <div className="rounded-xl border border-[#E9E9E7] bg-[#F7F7F5] p-2.5 space-y-2">
                  <div className="flex items-center justify-between px-1 text-xs font-semibold text-[#5F5E5B]">
                    <span>Complete</span>
                    <span className="rounded bg-white px-1.5 py-0.2 border border-[#E9E9E7] text-[10px]">34</span>
                  </div>

                  <div className="rounded-lg border border-[#E9E9E7] bg-white/70 p-2.5 shadow-xs space-y-1.5 opacity-80">
                    <div className="flex items-center gap-1.5 text-xs text-[#5F5E5B] line-through">
                      <CheckCircle2Icon className="size-3 text-[#2383E2] shrink-0" />
                      <span>Finalize launch timeline</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#E9E9E7] bg-white/70 p-2.5 shadow-xs space-y-1.5 opacity-80">
                    <div className="flex items-center gap-1.5 text-xs text-[#5F5E5B] line-through">
                      <CheckCircle2Icon className="size-3 text-[#2383E2] shrink-0" />
                      <span>All hands team alignment</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#E9E9E7] bg-white/70 p-2.5 shadow-xs space-y-1.5 opacity-80">
                    <div className="flex items-center gap-1.5 text-xs text-[#5F5E5B] line-through">
                      <CheckCircle2Icon className="size-3 text-[#2383E2] shrink-0" />
                      <span>Draft initial press release</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DemoModal open={isDemoModalOpen} onOpenChange={setIsDemoModalOpen} />
    </section>
  );
}
