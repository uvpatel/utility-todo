import * as React from "react";

export function Testimonials() {
  const testimonials = [
    {
      company: "CURSOR",
      companyFont: "font-mono font-bold tracking-widest text-xs",
      toneClass: "from-[#E5533D]/90 to-[#B8321F]/95",
      bgTone: "bg-[#E5533D]",
      quote:
        "Using the most AI-native tools like Utility Todo is an important competitive advantage for us to stay small while doing a lot.",
      name: "Michael Truell",
      role: "Co-founder & CEO",
      avatarInitials: "MT",
    },
    {
      company: "FAIRE",
      companyFont: "font-serif tracking-widest font-semibold text-xs",
      toneClass: "from-[#2F5FA8]/90 to-[#1B3F75]/95",
      bgTone: "bg-[#2F5FA8]",
      quote:
        "Utility Todo's thoughtful design speeds up collaboration and decisions so we can deliver impact to our customers faster.",
      name: "Renee Solorzano",
      role: "Sr. Director of Product Design",
      avatarInitials: "RS",
    },
    {
      company: "ramp ◿",
      companyFont: "font-bold tracking-tight text-sm",
      toneClass: "from-[#E8A21C]/90 to-[#B57A0F]/95",
      bgTone: "bg-[#E8A21C]",
      quote:
        "Autonomous agents help our team go beyond doing work with AI to building automated workflows that execute tasks for them.",
      name: "Ben Levick",
      role: "Head of Operations & Internal AI",
      avatarInitials: "BL",
    },
  ];

  return (
    <section id="testimonials" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:py-24">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl md:text-5xl">
          Trusted by teams that ship.
        </h2>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        {testimonials.map((item) => (
          <div
            key={item.name}
            className={`relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded-2xl p-7 text-white shadow-md transition-transform duration-200 hover:-translate-y-1 ${item.bgTone}`}
          >
            {/* Visual background gradient with subtle silhouette backdrop */}
            <div className={`absolute inset-0 bg-gradient-to-b ${item.toneClass}`} />

            {/* Subtle stylized background pattern */}
            <div className="absolute inset-0 opacity-15 mix-blend-overlay">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id={`pattern-${item.avatarInitials}`} width="30" height="30" patternUnits="userSpaceOnUse">
                    <circle cx="15" cy="15" r="1.5" fill="#ffffff" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill={`url(#pattern-${item.avatarInitials})`} />
              </svg>
            </div>

            {/* Dark gradient scrim at the bottom to guarantee WCAG AA contrast */}
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/85 via-black/40 to-transparent z-10" />

            {/* Top Company wordmark */}
            <div className="relative z-20">
              <span className={`${item.companyFont} uppercase tracking-wider text-white/90`}>
                {item.company}
              </span>
            </div>

            {/* Bottom Quote & Author */}
            <div className="relative z-20 space-y-3">
              <p className="text-base sm:text-lg font-medium leading-snug text-white">
                &ldquo;{item.quote}&rdquo;
              </p>
              <div>
                <div className="text-xs font-semibold text-white">{item.name}</div>
                <div className="text-[11px] text-white/80">{item.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
