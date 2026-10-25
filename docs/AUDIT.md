# Landing Page Codebase Audit

**Date:** 2026-10-25
**Application:** Utility Todo

## 1. Framework and Version
- **Framework:** Next.js 16.2.6 (App Router with Turbopack)
- **React:** React 19.2.4
- **TypeScript:** TypeScript 5.x
- **Build tool:** Next.js Turbopack (`next build`)

## 2. Styling Approach & Design Tokens
- **CSS Framework:** Tailwind CSS 4 with `@tailwindcss/postcss`
- **Component Primitives:** Radix UI (`radix-ui`), shadcn/ui components in `src/components/ui/`
- **Icons:** `lucide-react`
- **Landing Page Tokens (`docs/landingpagedesign.md`):**
  - `--bg: #FFFFFF`, `--bg-subtle: #F7F7F5`, `--bg-muted: #F1F1EF`
  - `--text: #111111`, `--text-2: #5F5E5B`, `--text-3: #9B9A97`
  - `--border: #E9E9E7`
  - `--accent: #2383E2`, `--accent-hover: #0F6FCC`, `--accent-soft: #E3F0FD`
  - `--tone-red: #E5533D`, `--tone-blue: #2F5FA8`, `--tone-amber: #E8A21C`
- **Isolation Strategy:** Scoped `.landing-page` container so internal workspace routes (`/todo`, `/dashboard`) retain their dark Notion workspace theme (`#191918`) while `/` renders the light Notion public marketing canvas.

## 3. Routing & Page Entry Point
- **Route `/`:** `src/app/page.tsx` is the public marketing landing page.
- **Route `/todo`:** Authenticated task workspace (`requireAuth()`).
- **Route `/dashboard`:** Authenticated metrics & throughput analytics (`requireAuth()`).
- **Route `/login`:** Authentication sign-in and sign-up page (`requireUnAuth()`).
- **Route `/api/auth/[...all]`:** Better Auth API endpoints.

## 4. Authentication Integration
- **Auth Provider:** Better Auth (v1.6.10) with Drizzle ORM and PostgreSQL.
- **Client Session:** `authClient.useSession()` in `@/lib/auth-client`.
- **Nav CTA Behavior:**
  - Logged out: displays "Log in" and "Get started free" / "Open app" pointing to `/login`.
  - Logged in: displays "Open app" pointing to `/todo`, plus user indicator.

## 5. Existing Shared Components
- `Button`, `Badge`, `Card`, `Input`, `Separator`, `Drawer`, `DropdownMenu` in `src/components/ui/`.
- All landing components will live in `src/components/landing/` to prevent regressions in the internal application.

## 6. Build, Lint & Quality Gates
- **Lint:** `npm run lint` is currently passing with **0 errors and 0 warnings**.
- **Build:** `npm run build` generates all static and dynamic pages with 0 errors.
- **Accessibility:** Semantic HTML landmarks (`header`, `nav`, `main`, `section`, `footer`), AA color contrast, visible focus rings, reduced-motion compliance.
