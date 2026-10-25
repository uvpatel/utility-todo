import { TopNav } from "@/components/landing/top-nav";
import { DismissibleToast } from "@/components/landing/dismissible-toast";
import { Hero } from "@/components/landing/hero";
import { LogoWall } from "@/components/landing/logo-wall";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { UseCaseChips } from "@/components/landing/use-case-chips";
import { Testimonials } from "@/components/landing/testimonials";
import { StatsTicker } from "@/components/landing/stats-ticker";
import { FinalCTA } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="landing-page min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* 1. Sticky Top Navigation */}
      <TopNav />

      {/* 2. Dismissible Toast Prompt */}
      <DismissibleToast />

      <main>
        {/* 3. Hero Section */}
        <Hero />

        {/* 4. Logo Wall */}
        <LogoWall />

        {/* 5. "AI where your team works" Feature Grid */}
        <FeatureGrid />

        {/* 6. Use-case Chips Row */}
        <UseCaseChips />

        {/* 7. "Trusted by teams that ship" Testimonials */}
        <Testimonials />

        {/* 8. Stats Ticker / Marquee */}
        <StatsTicker />

        {/* 9. Final CTA */}
        <FinalCTA />
      </main>

      {/* 10. Footer */}
      <Footer />
    </div>
  );
}
