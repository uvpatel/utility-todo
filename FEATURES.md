
Act as a senior full-stack engineer and product designer. Audit my existing Utility Todo application before implementing changes.

### Existing stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui and Radix UI
- Better Auth with GitHub OAuth and email/password configuration
- Drizzle ORM
- PostgreSQL with Neon-compatible connection strings
- Zustand for client-side todo state

### Objective

Evolve the existing application into a polished, reliable, single-user productivity application without restarting the project or unnecessarily replacing working code.

### Step 1: Audit

Inspect the existing codebase and report:

- Current routes and their functionality.
- Existing UI components and reusable patterns.
- Authentication and protected-route implementation.
- Database schema and migration configuration.
- Current todo data model and persistence behavior.
- Zustand usage and client/server state boundaries.
- Missing validation and authorization checks.
- Loading, error, empty, and success states.
- Accessibility, responsive design, and performance issues.
- Existing tests and production-build issues.

Distinguish verified findings from assumptions.

### Step 2: Propose an implementation plan

Prioritize:

1. Reliable PostgreSQL task persistence.
2. User-scoped server-side authorization.
3. Task creation, editing, completion, and deletion.
4. Priorities, due dates, and task status.
5. A polished responsive task workspace.
6. Dashboard statistics derived from real persisted data.
7. Search, filtering, and keyboard shortcuts.
8. Inbox and My Day views.
9. Projects and subtasks.
10. Recurring tasks and optional AI capabilities.

For every proposed change, identify the relevant existing files, expected behavior, dependencies, and acceptance criteria.

### Step 3: Establish implementation constraints

- Preserve the existing application and working functionality.
- Do not replace the authentication system without a compelling, documented reason.
- Use PostgreSQL as the source of truth for persisted tasks.
- Use Zustand for client-side UI state where appropriate, not as the only persistent storage layer.
- Validate all task inputs on the server.
- Enforce authenticated-user ownership for every protected data operation.
- Use Drizzle migrations for database changes.
- Reuse existing shadcn/ui components.
- Keep components in the existing src/components directory unless there is a strong architectural reason to do otherwise.
- Follow Next.js 16 App Router conventions and the project's installed package versions.
- Do not invent features, claim tests passed without running them, or fabricate performance metrics.
- Do not expose secrets or commit environment files.
- Avoid adding unnecessary dependencies.

### Step 4: Report before implementation

Return:

1. Current architecture summary.
2. Critical bugs and security risks.
3. UI/UX improvements.
4. Proposed database changes.
5. A phased implementation plan.
6. Exact files that need modification.
7. Acceptance criteria and verification commands.

Do not rewrite the entire application. Audit first, propose the plan, and then implement the highest-priority improvements incrementally while preserving existing functionality.
