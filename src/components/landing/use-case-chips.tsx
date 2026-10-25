import * as React from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  MessageSquareIcon,
  HeadphonesIcon,
  ShieldAlertIcon,
  FileBarChartIcon,
  WrenchIcon,
} from "lucide-react";

export function UseCaseChips() {
  const chips = [
    {
      title: "Triage product feedback",
      icon: <MessageSquareIcon className="size-4 text-[#2383E2]" />,
      badgeBg: "bg-[#E3F0FD]",
      href: "/todo",
    },
    {
      title: "Resolve support tickets in Slack",
      icon: <HeadphonesIcon className="size-4 text-[#E8A21C]" />,
      badgeBg: "bg-[#FDECC8]",
      href: "/todo",
    },
    {
      title: "Respond to security alerts faster",
      icon: <ShieldAlertIcon className="size-4 text-[#E5533D]" />,
      badgeBg: "bg-[#F5E0E9]",
      href: "/todo",
    },
    {
      title: "Automate weekly reporting",
      icon: <FileBarChartIcon className="size-4 text-emerald-600" />,
      badgeBg: "bg-[#DBEDDB]",
      href: "/dashboard",
    },
    {
      title: "Create your own developer tools",
      icon: <WrenchIcon className="size-4 text-purple-600" />,
      badgeBg: "bg-purple-100",
      href: "/todo",
    },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#9B9A97] mb-4">
        See what Utility Todo can do
      </p>

      {/* 5-up chips grid with mobile scroll-snap */}
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 sm:overflow-visible">
        {chips.map((chip) => (
          <Link
            key={chip.title}
            href={chip.href}
            className="group flex min-w-[200px] flex-col justify-between rounded-xl border border-[#E9E9E7] bg-white p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#D0D0CE] hover:shadow-xs"
          >
            <div className={`flex size-9 items-center justify-center rounded-lg ${chip.badgeBg}`}>
              {chip.icon}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs font-semibold text-[#111111]">
              <span className="leading-snug">{chip.title}</span>
              <ArrowRightIcon className="size-3.5 text-[#9B9A97] transition-transform group-hover:translate-x-1 group-hover:text-[#111111] shrink-0 ml-1.5" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
