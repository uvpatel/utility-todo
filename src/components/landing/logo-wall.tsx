import * as React from "react";

export function LogoWall() {
  const row1 = [
    { name: "OpenAI", font: "font-semibold tracking-wider text-base" },
    { name: "A24", font: "font-black tracking-widest text-lg" },
    { name: "Figma", font: "font-bold tracking-tight text-base" },
    { name: "FedEx", font: "font-extrabold tracking-tighter text-base" },
    { name: "ramp", font: "font-bold tracking-tight text-base" },
    { name: "CURSOR", font: "font-mono font-bold tracking-widest text-xs" },
    { name: "substack", font: "font-serif font-bold text-sm" },
    { name: "NVIDIA", font: "font-black tracking-widest text-xs" },
    { name: "TOYOTA", font: "font-extrabold tracking-widest text-xs" },
  ];

  const row2 = [
    { name: "clay", font: "font-bold tracking-tight text-sm" },
    { name: "Lamborghini", font: "font-serif italic font-bold text-sm tracking-wide" },
    { name: "David Zwirner", font: "font-serif text-sm tracking-wide" },
    { name: "▲ Vercel", font: "font-medium tracking-tight text-sm" },
    { name: "FAIRE", font: "font-serif font-semibold tracking-widest text-xs" },
    { name: "Lovable", font: "font-semibold tracking-tight text-sm" },
    { name: "goop", font: "font-serif font-medium text-sm lowercase" },
    { name: "Discord", font: "font-bold tracking-tight text-sm" },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 text-center sm:px-6">
      <p className="text-sm font-medium text-[#5F5E5B]">
        The most ambitious companies run on Utility Todo.
      </p>

      {/* Row 1 */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-[#9B9A97] opacity-80 transition-opacity hover:opacity-100 sm:gap-x-12">
        {row1.map((logo) => (
          <span
            key={logo.name}
            className={`${logo.font} select-none transition-colors hover:text-[#111111]`}
          >
            {logo.name}
          </span>
        ))}
      </div>

      {/* Row 2 */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-[#9B9A97] opacity-75 transition-opacity hover:opacity-100 sm:gap-x-12">
        {row2.map((logo) => (
          <span
            key={logo.name}
            className={`${logo.font} select-none transition-colors hover:text-[#111111]`}
          >
            {logo.name}
          </span>
        ))}
      </div>
    </section>
  );
}
