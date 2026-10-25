import * as React from "react";
import {
  TrophyIcon,
  GlobeIcon,
  RocketIcon,
  UsersIcon,
  ShieldCheckIcon,
} from "lucide-react";

export function StatsTicker() {
  const stats = [
    {
      label: "#1 Task & AI Workspace for high-velocity teams",
      icon: <TrophyIcon className="size-3.5 text-[#2383E2]" />,
    },
    {
      label: "100M+ tasks completed across 50 countries",
      icon: <GlobeIcon className="size-3.5 text-emerald-600" />,
    },
    {
      label: "Over 50% of top YC startups ship on our stack",
      icon: <RocketIcon className="size-3.5 text-amber-500" />,
    },
    {
      label: "1.4M+ active community members",
      icon: <UsersIcon className="size-3.5 text-purple-600" />,
    },
    {
      label: "62% of modern engineering orgs choose Utility Todo",
      icon: <ShieldCheckIcon className="size-3.5 text-[#2383E2]" />,
    },
  ];

  return (
    <section className="relative w-full overflow-hidden border-y border-[#E9E9E7] bg-white py-4.5">
      {/* Left and Right Edge Fade Masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent" />

      {/* Auto-scrolling Marquee */}
      <div className="animate-marquee flex items-center gap-12 text-xs font-medium text-[#5F5E5B]">
        {/* Sequence 1 */}
        {stats.map((stat, i) => (
          <div key={`stat-1-${i}`} className="flex items-center gap-2 shrink-0">
            {stat.icon}
            <span>{stat.label}</span>
          </div>
        ))}

        {/* Sequence 2 for seamless loop */}
        {stats.map((stat, i) => (
          <div key={`stat-2-${i}`} className="flex items-center gap-2 shrink-0">
            {stat.icon}
            <span>{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
