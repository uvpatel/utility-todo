"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  MicIcon,
  BotIcon,
  CheckCircle2Icon,
  ArrowUpIcon,
} from "lucide-react";

export function FeatureGrid() {
  return (
    <section id="features" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:py-24">
      {/* Section H2 */}
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl md:text-5xl">
          AI where your team works.
        </h2>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Card A: Capture Knowledge */}
        <Link
          href="/todo"
          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E9E9E7] bg-[#F7F7F5] p-8 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D0D0CE] hover:shadow-md cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9B9A97]">
                Capture knowledge
              </span>
              <div className="flex size-8 items-center justify-center rounded-full bg-[#111111] text-white transition-transform group-hover:translate-x-1">
                <ArrowRightIcon className="size-3.5" />
              </div>
            </div>
            <h3 className="mt-3 text-2xl font-bold tracking-tight text-[#111111]">
              Bring everything into one system of record.
            </h3>
          </div>

          {/* Embedded UI Illustration */}
          <div className="relative mt-8 -mb-8 overflow-hidden rounded-t-xl border-t border-x border-[#E9E9E7] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E9E9E7] pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[#111111]">
                <MicIcon className="size-4 text-[#2383E2]" />
                <span>Meetings & Context</span>
              </div>
              <div className="flex gap-2 text-[11px] text-[#5F5E5B]">
                <span className="font-semibold text-[#111111]">★ EPD meetings</span>
                <span>My meetings</span>
              </div>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-[#F1F1EF]">
                <span className="font-medium text-[#111111]">Technical Design Review</span>
                <div className="flex gap-1 text-[10px]">
                  <span className="rounded bg-[#DBEDDB] px-1.5 py-0.5 text-emerald-800">Growth</span>
                  <span className="rounded bg-[#F5E0E9] px-1.5 py-0.5 text-rose-800">Infra</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#F1F1EF]">
                <span className="font-medium text-[#111111]">Product + Design Crit — IA</span>
                <div className="flex gap-1 text-[10px]">
                  <span className="rounded bg-[#D3E5EF] px-1.5 py-0.5 text-blue-800">Design</span>
                  <span className="rounded bg-[#FDECC8] px-1.5 py-0.5 text-amber-800">Mobile</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#F1F1EF]">
                <span className="font-medium text-[#111111]">Sprint Planning (Cycle 28)</span>
                <div className="flex gap-1 text-[10px]">
                  <span className="rounded bg-[#DBEDDB] px-1.5 py-0.5 text-emerald-800">Product Ops</span>
                </div>
              </div>
            </div>

            {/* Audio Recording Pill */}
            <div className="mt-4 flex items-center justify-between rounded-full border border-[#E9E9E7] bg-[#F7F7F5] px-3.5 py-1.5 text-xs text-[#5F5E5B]">
              <span className="font-medium text-[#111111]">Technical Design Review</span>
              <div className="flex items-center gap-1 text-[#2383E2]">
                <span className="size-1 rounded-full bg-[#2383E2] animate-ping" />
                <span className="font-mono text-[11px]">|||ll|l|l||</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Card B: Find Answers */}
        <Link
          href="/dashboard"
          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E9E9E7] bg-[#F7F7F5] p-8 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D0D0CE] hover:shadow-md cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9B9A97]">
                Find answers
              </span>
              <div className="flex size-8 items-center justify-center rounded-full bg-[#111111] text-white transition-transform group-hover:translate-x-1">
                <ArrowRightIcon className="size-3.5" />
              </div>
            </div>
            <h3 className="mt-3 text-2xl font-bold tracking-tight text-[#111111]">
              Get answers, instantly—with citations.
            </h3>
          </div>

          {/* Embedded UI Illustration */}
          <div className="relative mt-8 -mb-8 overflow-hidden rounded-t-xl border-t border-x border-[#E9E9E7] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E9E9E7] pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[#111111]">
                <span>🏆 H2 Deal Flow Dashboard</span>
              </div>
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                <span className="size-1.5 rounded-full bg-emerald-500" /> Syncing
              </span>
            </div>

            <div className="mt-4 grid grid-cols-[1fr_1.5fr] items-center gap-4">
              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#F7F7F5]">
                <div className="text-2xl font-bold text-[#111111]">12</div>
                <div className="text-[10px] text-[#5F5E5B]">Wins Closed</div>
              </div>

              {/* Bar graph visualization */}
              <div className="flex items-end gap-2 h-16 pt-2">
                <div className="w-1/4 h-[40%] rounded-t bg-emerald-400" />
                <div className="w-1/4 h-[75%] rounded-t bg-[#2383E2]" />
                <div className="w-1/4 h-[90%] rounded-t bg-rose-400" />
                <div className="w-1/4 h-[60%] rounded-t bg-amber-400" />
              </div>
            </div>

            {/* AI Prompt Input Bar */}
            <div className="mt-4 flex items-center justify-between rounded-xl border border-[#2383E2]/40 bg-white px-3 py-2 text-xs text-[#111111] shadow-xs">
              <span className="truncate text-[#5F5E5B]">What are our biggest opportunities in H2?</span>
              <div className="flex size-6 items-center justify-center rounded-full bg-[#2383E2] text-white shrink-0">
                <ArrowUpIcon className="size-3" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Card C: Full Width (Automate Busywork with AI Agents) */}
      <Link
        href="/todo"
        className="group relative mt-6 block overflow-hidden rounded-2xl border border-[#E9E9E7] bg-[#F7F7F5] p-8 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D0D0CE] hover:shadow-md cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#9B9A97]">
            Automate busywork
          </span>
          <div className="flex size-8 items-center justify-center rounded-full bg-[#111111] text-white transition-transform group-hover:translate-x-1">
            <ArrowRightIcon className="size-3.5" />
          </div>
        </div>

        <h3 className="mt-3 text-2xl font-bold tracking-tight text-[#111111] sm:text-3xl">
          Keep work moving 24/7 with agents.
        </h3>

        {/* 2-column split layout inside card */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left panel: Task board */}
          <div className="overflow-hidden rounded-xl border border-[#E9E9E7] bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E9E9E7] pb-2 text-xs font-bold text-[#111111]">
              <span>⚙ Engineering Tasks</span>
              <span className="text-[#9B9A97] font-normal">Active Sprint</span>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="rounded-lg border border-[#E9E9E7] bg-[#F7F7F5] p-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#111111]">Fix wrap on H1</span>
                  <span className="rounded bg-[#F5E0E9] text-rose-800 px-1 py-0.2 text-[10px]">High</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#5F5E5B]">
                  <BotIcon className="size-3 text-[#2383E2]" />
                  <span>Assigned to Coding Agent</span>
                </div>
              </div>

              <div className="rounded-lg border border-[#E9E9E7] bg-[#F7F7F5] p-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#111111]">Animation refinements</span>
                  <span className="rounded bg-[#DBEDDB] text-emerald-800 px-1 py-0.2 text-[10px]">Design</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Coding Agent chat */}
          <div className="overflow-hidden rounded-xl border border-[#FDECC8] bg-[#FFFBF0] p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-[#E8A21C] text-white">
                <BotIcon className="size-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#111111]">Coding Agent</div>
                <div className="text-[10px] text-[#5F5E5B]">Autonomous Task Routing</div>
              </div>
            </div>

            <div className="rounded-lg bg-white/90 p-2.5 border border-[#FDECC8] text-xs text-[#5F5E5B]">
              &ldquo;Take a look at what&apos;s in Engineering Tasks to see if there&apos;s anything you can take off our team&apos;s plate.&rdquo;
            </div>

            <div className="rounded-lg bg-white p-3 border border-[#FDECC8] text-xs text-[#111111] space-y-1.5 shadow-2xs">
              <p className="font-medium">
                Let me take a quick look at what&apos;s in flight and what&apos;s new.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700">
                <CheckCircle2Icon className="size-3 text-emerald-600" />
                <span>Updated 5 tasks in PostgreSQL</span>
              </div>
              <p className="text-[#5F5E5B] text-[11px]">
                I assigned myself &ldquo;Fix wrap on H1&rdquo; as highest priority. Want me to go ahead and get started?
              </p>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
