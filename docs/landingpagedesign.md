
# Landing Page Design Spec

Reference: a modern SaaS "AI workspace" landing page (single long-scroll page, white canvas, oversized bold headline, product-UI mockups as hero imagery). Use this as a structural and stylistic reference only. Use your own brand name, copy, logos, illustrations and screenshots. Do not copy trademarks, customer logos, or testimonials.

## 1. Goals

- Communicate one idea in under 5 seconds: "Teams and AI agents work together."
- Two conversion paths: primary "Get started free", secondary "Request a demo".
- Build trust fast: logo wall, quotes, stats.
- Fast and accessible: Lighthouse 95+ on performance, accessibility, SEO.

## 2. Page Structure (top to bottom)

| #  | Section                                   | Purpose                                 |
| -- | ----------------------------------------- | --------------------------------------- |
| 1  | Sticky top nav                            | Orientation + CTA                       |
| 2  | Dismissible banner (top-right toast)      | Optional "open in app" prompt           |
| 3  | Hero                                      | Value prop, CTAs, product mockup        |
| 4  | Logo wall                                 | Social proof                            |
| 5  | "AI where your team works" feature grid   | 3 feature cards (2 + 1 wide)            |
| 6  | Use-case chips row                        | "See what it can do" quick entry points |
| 7  | "Trusted by teams that ship" testimonials | 3 quote cards                           |
| 8  | Stats ticker                              | Marquee of credibility numbers          |
| 9  | Final CTA                                 | Repeat primary actions                  |
| 10 | Footer                                    | Link columns, quote, legal, language    |

## 3. Layout System

- Max content width: 1200px (hero text centered, mockup ~1000px).
- Section horizontal padding: 24px mobile, 48px tablet, 64px desktop.
- 12-column grid on desktop, 4-column on mobile.
- Vertical rhythm between sections: 120-160px desktop, 72-96px mobile.
- Cards: 2-up grid with a full-width third card below (feature section). Testimonials: 3-up, collapse to horizontal scroll-snap on mobile.
- Breakpoints: 480 / 768 / 1024 / 1280.

## 4. Design Tokens

### Color

```
--bg:            #FFFFFF
--bg-subtle:     #F7F7F5   /* card surfaces, CTA band */
--bg-muted:      #F1F1EF   /* inner mockup panels */
--text:          #111111   /* headings */
--text-2:        #5F5E5B   /* body, captions */
--text-3:        #9B9A97   /* meta, footer headings */
--border:        #E9E9E7
--accent:        #2383E2   /* primary buttons, links, highlight dot */
--accent-hover:  #0F6FCC
--accent-soft:   #E3F0FD   /* secondary button bg, hero word pill */
--tag-green:     #DBEDDB
--tag-blue:      #D3E5EF
--tag-pink:      #F5E0E9
--tag-yellow:    #FDECC8
/* Testimonial card overlays (duotone photo + tint) */
--tone-red:      #E5533D
--tone-blue:     #2F5FA8
--tone-amber:    #E8A21C
```

Dark mode: out of scope for v1. Define tokens as CSS variables so it can be added later.

### Typography

- Family: Inter (or similar neutral grotesk) for UI and body. Optional serif accent for the footer quote.
- Hero H1: 96px / 1.0 line-height / weight 700 / tracking -0.04em (clamp to 44px on mobile).
- Section H2: 56px / 1.05 / 700 / -0.03em (clamp to 32px mobile).
- Card title: 20px / 1.3 / 600.
- Body: 18px / 1.5 / 400, color `--text-2`.
- Small / meta: 13-14px / 1.4.
- Use `clamp()` for fluid sizing instead of many breakpoints.

### Radius, shadow, spacing

- Radius: 6px buttons, 16px cards, 12px inner panels, 999px pills.
- Shadow (mockup frame): `0 24px 60px rgba(0,0,0,.08), 0 0 0 1px rgba(0,0,0,.06)`.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.

## 5. Components

### 5.1 Top Nav

- Left: logo mark. Center: Product ▾, Resources ▾, Pricing, Request a demo. Right: "Log in" (text) and "Open app" (solid accent button).
- Height 56px, sticky, white with 1px bottom border appearing after 8px scroll.
- Dropdowns open on hover/focus with a 150ms fade; fully keyboard accessible (Arrow keys, Esc to close).
- Mobile: hamburger opening a full-height sheet.

### 5.2 Dismissible Toast (optional)

- Top-right card, 1px border, soft shadow: "Skip this page next time? Always open app →" with a close (×) icon.
- Persist dismissal in `localStorage`. Hidden on mobile.

### 5.3 Hero

- Centered H1 on two lines. One word ("Think") is wrapped in an `accent-soft` rounded pill with a small solid accent dot to the left (inline-flex, same baseline).
- Subheading, 18px, centered, max-width 560px.
- Buttons: Primary "Get started free" (accent fill, white text), Secondary "Request a demo" (accent-soft fill, accent text). Height 40px, padding 0 16px, radius 6px.
- Below: large product mockup in a browser-style frame (window dots, sidebar, Kanban board). Two hand-drawn style line illustrations (character at left edge, face doodle at upper right) overlap the frame edges. Use your own illustrations, SVG, lazy-loaded.
- Mockup is a static optimized image (WebP/AVIF) with `priority` loading, not live UI. Fade/slide up on load.

### 5.4 Logo Wall

- Caption "The most ambitious companies run on [Product]" (14px, `--text-3`).
- Two rows of grayscale SVG logos, 7-8 per row, centered, wrapping on mobile into a 3-column grid. Use placeholder logos until you have real permissions.

### 5.5 Feature Cards ("AI where your team works.")

- H2 left-aligned.
- Card = `--bg-subtle` surface, 16px radius, 32px padding. Contains: small eyebrow label (14px, `--text-3`), title with a circular arrow button on the right (32px, near-black fill), and a UI illustration cropped by the card's bottom edge.
- Card A: "Capture knowledge" with a meetings table and an audio-recording pill.
- Card B: "Find answers" with a dashboard mockup and an AI prompt bar.
- Card C (full width): "Automate work" with a task board plus an agent chat panel.
- Hover: card lifts 2px, arrow button nudges right 2px, border darkens slightly. Whole card is one link.

### 5.6 Use-case Chips

- Caption "See what [Product] can do".
- 5-up row of bordered cards (icon in a rounded colored badge + two-line label + arrow). Examples: Triage product feedback, Resolve support tickets, Respond to security alerts, Automate weekly reporting, Create your own developer tools.
- Mobile: horizontal scroll-snap.

### 5.7 Testimonials ("Trusted by teams that ship.")

- 3 cards, aspect ratio ~3:4, 16px radius.
- Background: duotone portrait photo with a colored multiply overlay (`--tone-*`). Top-left company wordmark in white. Bottom: quote (white, 18-20px, weight 500) plus name and role (13px, 80% opacity).
- Use real, permissioned quotes or clearly marked placeholders.
- Ensure white text on overlay meets WCAG AA contrast (add a bottom gradient scrim if needed).

### 5.8 Stats Ticker

- Single row, 14px, `--text-3`, each stat with a small icon. Auto-scrolling marquee, pauses on hover, respects `prefers-reduced-motion` (static wrap instead).
- Edge fade masks on left and right.
- Example stats (replace with your real numbers): "100M users in over 50 countries", "Over 50% of YC companies", "1.4M+ community members", "62% of Fortune 100".

### 5.9 Final CTA

- Subtle `--bg-subtle` band, 240px+ tall, H2 "Get started today." centered, same two buttons.

### 5.10 Footer

- Left: logo, wordmark, quote in serif (small). Right: 4 link columns (Product, Resources, Company, For). Column headings 13px `--text-3`, links 14px `--text`.
- Bottom row: copyright, "Cookie settings", language selector (right).
- Mobile: columns collapse to 2-up, then accordion if needed.

## 6. Motion

- Entrance: 12px translate-up + fade, 400ms ease-out, staggered 60ms (IntersectionObserver, once).
- Hero mockup: subtle parallax on illustrations (max 12px), disabled for reduced motion.
- Buttons: 120ms background transition. Cards: 200ms transform/border.
- Nothing may animate layout properties (use transform/opacity only).

## 7. Accessibility

- Semantic landmarks: `header`, `nav`, `main`, `section[aria-labelledby]`, `footer`.
- One `h1`. Headings in order.
- Visible focus ring: 2px accent outline, 2px offset.
- Color contrast AA minimum. Check `--text-3` on white (use only for non-essential meta text, bump to `#7A7977` if needed).
- Decorative illustrations `alt=""`. Meaningful mockups get a descriptive alt.
- Marquee: pausable, reduced-motion safe. Dropdowns keyboard operable.
- Touch targets at least 44px on mobile.

## 8. Performance Budget

- LCP under 2.0s on 4G: hero mockup preloaded, AVIF/WebP, explicit width/height.
- JS under 120KB gzipped initial. No heavy animation libraries (CSS first, optional Framer Motion lazily).
- Fonts: self-host, `font-display: swap`, subset to Latin, preload the bold weight only.
- Logos as inline or sprite SVG. Below-the-fold images lazy.

## 9. SEO and Analytics

- Title and meta description, Open Graph and Twitter card image, canonical URL, JSON-LD `Organization` and `SoftwareApplication`.
- Track events: `cta_primary_click`, `cta_demo_click`, `nav_click`, `feature_card_click`, scroll depth (25/50/75/100).
- Cookie consent banner gating analytics (footer "Cookie settings" reopens it).

## 10. Content Checklist (fill before build)

- [ ] Product name, logo, favicon
- [ ] Hero headline and highlighted word, subheadline
- [ ] 3 feature card titles, eyebrows, mockup screenshots
- [ ] 5 use-case labels with icons
- [ ] 3 testimonials with approval, 3 portrait photos
- [ ] 12-16 customer logos (with permission)
- [ ] 4-6 real stats
- [ ] Footer links and legal pages (Terms, Privacy, Security)
