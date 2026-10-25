# GitHub App & Repository Integration Plan — Utility Todo

## 1. Executive Summary & Architecture

This plan establishes a production-grade GitHub App integration for Utility Todo (`uvpatel`), designed to manage repositories, monitor real-time development activity, and provide bidirectional synchronization between GitHub issues and Utility Todo personal tasks.

### Two-Tier GitHub Architecture

1. **Authentication (Better Auth OAuth)**:
   - Preserved exactly as-is for user authentication and session management.
   - Identified the Utility Todo user connecting repositories.
   - Does not handle repository administration or webhook delivery.

2. **Integration (GitHub App)**:
   - Uses GitHub App installation authentication with RS256 JWT and Installation Access Tokens.
   - Manages authorized repositories without over-permissioning.
   - Securely receives and verifies `X-Hub-Signature-256` webhooks.
   - Performs real-time bidirectional synchronization between GitHub issues and Utility Todo tasks.
   - Queries CI check runs, pull requests, and development activity.

---

## 2. Implementation Stages

| Stage | Focus Area | Deliverables | Verification |
|-------|------------|--------------|--------------|
| **Phase 1: Audit & Foundation** | Cryptography & App Auth | RS256 JWT generator, installation access token manager, Octokit client, token encryption | Unit tests with RSA keys |
| **Phase 2: Database Schema** | Relational Invariants | Drizzle schema updates, relations, indices, migrations | Migration execution check |
| **Phase 3: Repository Integration** | Discovery & Permissions | Live repository discovery, selection toggles, PR & issue querying, CI checks | API verification & UI states |
| **Phase 4: Issue & Task Sync** | Bidirectional Mapping | Import issue as task, create issue from task, conflict handling, loop prevention | Sync invariants test suite |
| **Phase 5: Webhooks & Realtime** | Event-Driven Updates | Timing-safe HMAC verification, deduplication, event routing, UI cache revalidation | Webhook signature test suite |
| **Phase 6: UI & Workflow** | Productivity Interface | Settings integration card, repository management, activity feed, Kanban badges | Build and layout inspection |
| **Phase 7: Setup Guide & Docs** | Admin Documentation | Step-by-step GitHub App configuration for `uvpatel`, env guide, local webhook tunneling | End-to-end documentation |

---

## 3. Database Schema Design

### Tables

1. `github_installations`:
   - `id`: UUID PK
   - `user_id`: FK -> `user.id` (cascade delete)
   - `installation_id`: GitHub App Installation ID
   - `app_id`: GitHub App ID
   - `account_login`: Account or organization handle (e.g., `uvpatel`)
   - `account_type`: `User` or `Organization`
   - `account_avatar_url`: Avatar URL
   - `target_type`: Installation target type
   - `repository_selection`: `all` | `selected`
   - `access_token`: AES-256-GCM encrypted token (optional user token)
   - `permissions`: JSON string of granted permissions
   - `last_webhook_at`: Timestamp of latest received webhook
   - `last_webhook_event`: Name of latest webhook event
   - `last_sync_error`: Latest synchronization error message
   - Timestamps: `created_at`, `updated_at`

2. `github_repositories`:
   - `id`: UUID PK
   - `user_id`: FK -> `user.id`
   - `installation_id`: References installation
   - `github_repo_id`: GitHub Repository ID
   - `name`: Repository short name
   - `full_name`: `owner/repo`
   - `owner`: Repository owner
   - `private`: Boolean visibility
   - `html_url`: Web URL
   - `description`: Repository description
   - `default_branch`: e.g. `main`
   - `open_issues_count`: Open issues count
   - `open_prs_count`: Open pull requests count
   - `is_selected`: Boolean tracking selection
   - `last_synced_at`: Timestamp
   - Timestamps: `created_at`, `updated_at`

3. `github_issue_mappings`:
   - `id`: UUID PK
   - `user_id`: FK -> `user.id`
   - `todo_id`: FK -> `todos.id` (cascade delete)
   - `repository_full_name`: e.g. `uvpatel/utility-todo`
   - `github_issue_id`: Remote issue ID
   - `issue_number`: Issue number integer
   - `issue_url`: HTML URL to GitHub issue
   - `issue_state`: `open` | `closed`
   - `issue_title`: Title
   - `issue_body`: Description
   - `issue_author`: Author handle
   - `issue_assignee`: Assignee handle
   - `issue_labels`: JSON string array
   - `sync_direction`: `bidirectional` | `to_local` | `to_remote`
   - `sync_status`: `synced` | `pending` | `conflict` | `error`
   - `sync_origin`: `webhook` | `user` | `reconcile`
   - `last_remote_updated_at`: Remote modification timestamp
   - `last_local_updated_at`: Local modification timestamp
   - `last_synced_at`: Timestamp
   - `last_sync_error`: Error message if failed
   - Unique Index: `(user_id, repository_full_name, issue_number)`
   - Unique Index: `(user_id, todo_id)`

4. `github_sync_settings`:
   - `id`: UUID PK
   - `user_id`: FK -> `user.id` (unique)
   - `auto_sync_on_webhook`: Boolean
   - `sync_status_changes`: Boolean
   - `sync_title_changes`: Boolean
   - `sync_description_changes`: Boolean
   - `sync_labels`: Boolean
   - `sync_assignees`: Boolean
   - `conflict_strategy`: `newer_wins` | `github_wins` | `local_wins`
   - Timestamps: `created_at`, `updated_at`

5. `github_webhook_events`:
   - `id`: UUID PK
   - `delivery_id`: Unique delivery ID from `X-GitHub-Delivery`
   - `event_type`: Event name from `X-GitHub-Event`
   - `action`: Specific event action
   - `payload`: Full JSON payload
   - `status`: `processed` | `ignored` | `error`
   - `error`: Error string if processing failed
   - `created_at`: Timestamp

---

## 4. API & Webhook Contracts

### Endpoints

- `GET /api/integrations/github/connect`: Initiates connection. If GitHub App slug is present, redirects to `https://github.com/apps/<app-slug>/installations/new?state=...`.
- `GET /api/integrations/github/callback`: Handles GitHub post-installation and OAuth redirects, validates state parameter with HMAC-SHA256, stores installation IDs and discovers authorized repositories.
- `POST /api/integrations/github/disconnect`: Revokes and deletes installation data, preserving all local tasks.
- `POST /api/integrations/github/webhook`: Ingests real-time events. Validates `X-Hub-Signature-256`, deduplicates deliveries, routes to idempotent handlers, and revalidates dashboard cache.

---

## 5. Bidirectional Synchronization & Conflict Strategy

### Invariants
1. **Uniqueness**: One GitHub issue cannot map to more than one task per user; one task cannot map to more than one issue.
2. **Loop Prevention**: Every mutation tags `sync_origin` (`webhook` vs `user` vs `reconcile`). A webhook event never pushes back to GitHub; a local user edit only syncs to GitHub when values differ.
3. **Data Preservation**: Unlinking or disconnecting never deletes local tasks or issues.
4. **Conflict Resolution**:
   - `newer_wins`: Compares `updatedAt` timestamps and adopts the later change.
   - `github_wins`: Remote changes take precedence.
   - `local_wins`: Local changes take precedence.

---

## 6. Testing Strategy

1. **Cryptographic Validation**: AES-256-GCM token encryption, HMAC-SHA256 OAuth state generation/verification with 10-minute expiry, RS256 JWT generation with valid RSA key pairs, and timing-safe webhook signature verification.
2. **Sync Logic Invariants**: Bidirectional status mapping, uniqueness validation, origin tagging, echo loop prevention, and task data preservation on disconnect.
3. **Repository Discovery & CI Checks**: Real metadata querying without fake/mock fallback dependencies.
4. **End-to-End Suite**: 17 unit tests passing with `npm test`, clean TypeScript build with `npx tsc --noEmit`, ESLint passing with `npm run lint`, and full production build passing with `npm run build`.

---

## 7. Status & Sign-off

- [x] Phase 1: Cryptography, RS256 JWT, and Installation Token Engine
- [x] Phase 2: Drizzle Relational Schema & Invariants
- [x] Phase 3: Live Repository Discovery, CI Checks & Branch Monitoring
- [x] Phase 4: Issue-to-Task & Task-to-Issue Bidirectional Sync Engine
- [x] Phase 5: Verified `X-Hub-Signature-256` Webhooks with Revalidation
- [x] Phase 6: Settings & Dashboard UI (No Mock Data, Live In-App Setup Checklist)
- [x] Phase 7: Setup Guide (`docs/github-app-setup.md`) & Template (`.env.example`)
- [x] Verification: `npm test` (17/17 pass), `npx tsc --noEmit` (0 errors), `npm run lint` (0 errors), `npm run build` (success)
2. **Invariants Verification**: Enforce uniqueness of issue mappings and task links.
3. **Bidirectional Mapping**: Verify status mapping (`open` <-> `todo`, `closed` <-> `done/completed`).
4. **Loop Prevention**: Verify that webhook-triggered updates do not echo mutations back to GitHub.
5. **No Mock Data**: Ensure live queries against GitHub use authenticated App/OAuth tokens and fail gracefully with actionable setup instructions when unconfigured.
