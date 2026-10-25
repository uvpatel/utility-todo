# Execution Plan: Landing Page in an Existing Web App

Companion to `design.md`. Use this when the landing page must live inside a codebase that already exists (shared auth, routing, styling, deploy), instead of a fresh project.

Estimated effort: 4-6 working days, depending on how far the existing styling differs from the design tokens.

## Phase 0: Audit the Existing codebase

Answer these before writing code. Put the answers in a short `AUDIT.md`.

- [ ] Framework and version (Next.js pages/app router, Vite + React, CRA, Remix, plain HTML, etc.)
- [ ] Styling approach (Tailwind, CSS Modules, styled-components, shadcn/ui, MUI) and whether a theme/tokens file exists
- [ ] Routing: where is `/` today? Is it already a dashboard, a login redirect, or an old landing page?
- [ ] Auth: how do logged-in vs logged-out users reach `/`? ("Log in" and "Open app" buttons depend on this)
- [ ] Existing shared components (Button, Container, Navbar, Footer) that can be reused or must be left alone
- [ ] Fonts, global CSS resets, dark-mode setup
- [ ] Build, lint, test and deploy pipeline, plus environment/preview setup
- [ ] Analytics and consent tooling already in place

**Done when:** you know exactly where the landing page mounts and which existing pieces it must respect.

## Phase 1: Decide the Integration Strategy

Pick one and write it down.

| Option                                                                                              | When to choose                       | Risk                                     |
| --------------------------------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------- |
| **A. Replace `/`** with the landing page; move the old home to `/app` or `/dashboard`   | Old `/` has no value for visitors  | Breaks bookmarks and redirects; add 301s |
| **B. New route** (`/home`, `/welcome`) behind a flag, switch `/` later                  | Safest for production sites          | Two entry points for a while             |
| **C. Route group / separate layout** (e.g. `(marketing)` group) with its own Nav and Footer | App has its own authenticated layout | Needs layout isolation                   |

Recommendation: **C + B**. Build in an isolated marketing layout on a new route behind a feature flag, then flip `/` once approved.

## Phase 2: Isolate Styles and Tokens 

- [ ] Add design tokens from as scoped CSS variables (e.g. under `.landing` or the marketing layout root) so they do not override app styles
- [ ] If Tailwind is present: extend the theme with namespaced keys (`landing-accent`, etc.) instead of overwriting existing colors
- [ ] Load the landing font only in the marketing layout, not globally
- [ ] Confirm no global CSS leaks both ways (check a dashboard page before and after)
- [ ] Reuse existing `Button`/`Container` only if they match the spec; otherwise create `landing/` variants and leave originals untouched

-
-

## Phase 4: Build Sections )

Follow docs, in this order:

1. Nav + Footer (wire "Log in" and "Open app" to real auth routes; show "Open app" instead of "Log in" when a session exists)
2. Hero (CTA targets: signup route and demo request)
3. Logo wall + stats ticker
4. Feature cards + use-case chips
5. Testimonials + final CTA

Rules while building:

- Small PRs, one section each, behind the flag
- No edits to shared components without a separate PR and a regression check
- Content only from `content/landing.ts`

## Phase 5: Integrate with the App

- [ ] CTA links to real signup/login routes, preserving `?redirect=` or UTM params
- [ ] Logged-in users: skip landing and redirect to the app (or show "Open app")
- [ ] Demo request: reuse the existing form/email pipeline, or add a minimal endpoint
- [ ] Hook into existing analytics and consent; add the events listed in `design.md`
- [ ] Update `sitemap.xml`, `robots.txt`, canonical tags and metadata

## Phase 6: Quality Gates

- [ ] Regression: key app pages (login, dashboard, settings) look and behave the same
- [ ] Lighthouse mobile 95+ on the landing route, and compare bundle size before/after (landing code must not bloat the app bundle; use route-level code splitting)
- [ ] Accessibility: axe, keyboard walkthrough, contrast
- [ ] Responsive QA at 320 / 390 / 768 / 1024 / 1440
- [ ] Cross-browser (Chrome, Safari iOS, Firefox)
- [ ] Existing tests and CI pass

## Phase 7: Rollout

- [ ] Deploy to a preview URL, review with the team
- [ ] Enable the flag for a small share of traffic or a staging domain first
- [ ] Flip `/` to the landing page, add 301 redirects for any moved routes
- [ ] Monitor errors, Web Vitals, conversion events for a week
- [ ] Keep the flag for one release as an instant rollback, then remove it

## Risks and Mitigations

| Risk                              | Mitigation                                                                |
| --------------------------------- | ------------------------------------------------------------------------- |
| Landing CSS breaks existing pages | Scope tokens to the marketing layout; before/after screenshot check       |
| Auth redirect loops               | Test logged-in and logged-out paths explicitly                            |
| SEO loss from moving old `/`    | 301 redirects, keep canonical URLs stable                                 |
| Bundle growth hurts the app       | Route-level splitting; no landing deps in shared chunks                   |
| Shared component regressions      | Do not modify; create landing variants                                    |
| Placeholder content ships         | Content checklist in `design.md` must be complete before the flag flips |

## Definition of Done

- Landing route live in the existing app with an isolated layout and scoped styles
- No regressions in existing pages; CI green
- Auth-aware CTAs working, analytics and consent wired
- Lighthouse mobile at least 95 on all four categories
- Rollback available through the flag for one release
