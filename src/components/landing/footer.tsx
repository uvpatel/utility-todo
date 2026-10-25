"use client";

import * as React from "react";
import Link from "next/link";
import { CommandIcon, GlobeIcon, ChevronDownIcon } from "lucide-react";
import { CookieModal } from "./cookie-modal";
import { DemoModal } from "./demo-modal";

export function Footer() {
  const [isCookieModalOpen, setIsCookieModalOpen] = React.useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = React.useState(false);

  const productLinks = [
    { label: "Features", href: "#features" },
    { label: "What's New", href: "#" },
    { label: "Task AI", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Request a demo", action: () => setIsDemoModalOpen(true) },
    { label: "Open app", href: "/todo" },
  ];

  const resourceLinks = [
    { label: "Customer stories", href: "#testimonials" },
    { label: "Connections", href: "#" },
    { label: "Marketplace", href: "#" },
    { label: "Help Center", href: "#" },
    { label: "Community", href: "#" },
  ];

  const companyLinks = [
    { label: "About us", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Security", href: "#" },
    { label: "Status", href: "#" },
    { label: "Terms & privacy", href: "#" },
    { label: "Your privacy rights", href: "#" },
  ];

  const forLinks = [
    { label: "Enterprise", href: "#" },
    { label: "Small businesses", href: "#" },
    { label: "Startups", href: "#" },
    { label: "Developers", href: "#" },
  ];

  return (
    <>
      <footer className="w-full border-t border-[#E9E9E7] bg-white py-14 px-4 sm:px-8 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.5fr_3fr]">
            {/* Left Column: Brand & Marshall McLuhan Quote */}
            <div className="flex flex-col justify-between space-y-8">
              <div>
                <Link href="/" className="flex items-center gap-2.5 text-[#111111]">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-[#111111] text-white">
                    <CommandIcon className="size-4" />
                  </div>
                  <span className="font-semibold tracking-tight text-base text-[#111111]">
                    Utility Todo
                  </span>
                </Link>

                <div className="mt-8 max-w-xs space-y-1.5 text-xs text-[#5F5E5B]">
                  <p className="font-serif italic text-sm text-[#111111]">
                    &ldquo;We shape our tools, and thereafter our tools shape us.&rdquo;
                  </p>
                  <p className="text-[11px] text-[#9B9A97]">Marshall McLuhan</p>
                </div>
              </div>
            </div>

            {/* Right Columns: 4 Links Columns */}
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {/* Product */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-[#9B9A97]">Product</div>
                <ul className="space-y-2 text-xs text-[#5F5E5B]">
                  {productLinks.map((item) => (
                    <li key={item.label}>
                      {item.action ? (
                        <button
                          type="button"
                          onClick={item.action}
                          className="hover:text-[#111111] transition-colors cursor-pointer"
                        >
                          {item.label}
                        </button>
                      ) : (
                        <Link href={item.href || "#"} className="hover:text-[#111111] transition-colors">
                          {item.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resources */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-[#9B9A97]">Resources</div>
                <ul className="space-y-2 text-xs text-[#5F5E5B]">
                  {resourceLinks.map((item) => (
                    <li key={item.label}>
                      <Link href={item.href} className="hover:text-[#111111] transition-colors">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-[#9B9A97]">Company</div>
                <ul className="space-y-2 text-xs text-[#5F5E5B]">
                  {companyLinks.map((item) => (
                    <li key={item.label}>
                      <Link href={item.href} className="hover:text-[#111111] transition-colors">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Utility Todo for */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-[#9B9A97]">Utility Todo for</div>
                <ul className="space-y-2 text-xs text-[#5F5E5B]">
                  {forLinks.map((item) => (
                    <li key={item.label}>
                      <Link href={item.href} className="hover:text-[#111111] transition-colors">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-[#E9E9E7] pt-6 text-xs text-[#9B9A97] sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-4">
              <span>© {new Date().getFullYear()} Utility Todo, Inc.</span>
              <button
                type="button"
                onClick={() => setIsCookieModalOpen(true)}
                className="hover:text-[#111111] underline underline-offset-2 transition-colors cursor-pointer"
              >
                Cookie settings
              </button>
            </div>

            <div className="flex items-center gap-1.5 rounded-md border border-[#E9E9E7] bg-white px-2.5 py-1 text-xs text-[#5F5E5B] hover:text-[#111111] cursor-pointer">
              <GlobeIcon className="size-3.5" />
              <span>English (US)</span>
              <ChevronDownIcon className="size-3 opacity-60" />
            </div>
          </div>
        </div>
      </footer>

      <CookieModal open={isCookieModalOpen} onOpenChange={setIsCookieModalOpen} />
      <DemoModal open={isDemoModalOpen} onOpenChange={setIsDemoModalOpen} />
    </>
  );
}
