# GitHub App Configuration & Setup Guide

This guide walks through configuring a dedicated **GitHub App** on GitHub account `uvpatel` to enable repository visibility, pull request tracking, real-time webhooks, and bidirectional task synchronization with **Utility Todo**.

---

## 1. Architecture Overview

Utility Todo uses a two-tier authentication architecture:

1. **User Authentication (Better Auth)**:
   - Uses GitHub OAuth to authenticate your user identity in Utility Todo.
   - Handled by `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.

2. **Repository & Workflows Integration (GitHub App)**:
   - Uses a registered GitHub App with an RS256 JWT and short-lived Installation Access Tokens (1-hour expiration, auto-refreshed).
   - Provides granular repository permissions without requiring personal access tokens (PATs) or broad user-scope access.
   - Handled by `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, and `GITHUB_WEBHOOK_SECRET`.

---

## 2. Step-by-Step GitHub App Registration

1. Navigate to GitHub App Settings:
   - Go to [GitHub Settings → Developer Settings → GitHub Apps](https://github.com/settings/apps) while signed in as `uvpatel`.
   - Click **New GitHub App**.

2. **App Details**:
   - **GitHub App name**: `Utility Todo uvpatel` (or any unique name).
   - **Homepage URL**: `http://localhost:3000` (or your production deployment domain, e.g., `https://utility-todo.yourdomain.com`).
   - **Callback URL**: `http://localhost:3000/api/integrations/github/callback` (or `https://<your-domain>/api/integrations/github/callback`).
   - **Request user authorization (OAuth) during installation**: Checked.

3. **Webhook Configuration**:
   - **Active**: Checked.
   - **Webhook URL**: `http://localhost:3000/api/integrations/github/webhook` (for local development with webhooks, use Smee.io or ngrok: e.g., `https://smee.io/your-channel`).
   - **Webhook secret**: Generate a random secure string (e.g., using `openssl rand -hex 24`). Save this string as `GITHUB_WEBHOOK_SECRET`.

4. **Permissions**:
   Configure the following repository permissions:
   | Permission | Access | Purpose |
   | :--- | :--- | :--- |
   | **Issues** | **Read & write** | Read issues to import as tasks, update status/title/body when tasks change, and create new issues from tasks. |
   | **Pull requests** | **Read-only** | Monitor pull request activity, branch refs, and draft/merged states. |
   | **Commit statuses** / **Checks** | **Read-only** | Display CI test and build results for selected repositories. |
   | **Metadata** | **Read-only** | Mandatory for GitHub Apps to read repository names and metadata. |

5. **Subscribe to Events**:
   Under **Subscribe to events**, select:
   - `Issues`
   - `Pull request`
   - `Check run` / `Status`
   - `Installation`
   - `Installation target`

6. **Where can this GitHub App be installed?**:
   - Select **Only on this account** (`uvpatel`).

7. Click **Create GitHub App**.

---

## 3. Generate RSA Private Key (.pem)

After creating the app:
1. In the app settings page, locate the **App ID** near the top (e.g., `5468398`).
2. Scroll down to the **Private keys** section.
3. Click **Generate a private key**.
4. GitHub will generate and download an RSA private key file: `utility-todo.YYYY-MM-DD.private-key.pem`.
5. Open the `.pem` file. It will look like:
   ```pem
   -----BEGIN RSA PRIVATE KEY-----
   MIIEowIBAAKCAQEA...
   ...
   -----END RSA PRIVATE KEY-----
   ```
6. Format the key for `.env`:
   - Either replace all line breaks with `\n`:
     ```env
     GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----"
     ```
   - Or base64 encode the `.pem` file contents:
     ```bash
     base64 -i utility-todo.private-key.pem | tr -d '\n'
     ```
     and paste the resulting string in `GITHUB_APP_PRIVATE_KEY`.

---

## 4. Install the App on `uvpatel`

1. On the left navigation of your App's settings, click **Install App**.
2. Click **Install** next to account `uvpatel`.
3. Choose repository access:
   - **All repositories**, or
   - **Only select repositories** (e.g., your active projects).
4. Click **Install**.
5. After installing, GitHub redirects to your Callback URL (`/api/integrations/github/callback?installation_id=...&setup_action=install`).
6. Utility Todo captures the installation ID, verifies ownership, securely saves the configuration, and syncs your repository list.

---

## 5. Environment Variables Checklist

Add the following to your `.env` file:

```env
# Better Auth (User Sign-In)
BETTER_AUTH_SECRET="your-32-byte-secret"
BETTER_AUTH_URL="http://localhost:3000"

# GitHub OAuth (User Sign-In via Better Auth)
GITHUB_CLIENT_ID="Iv1.xxxxxx"
GITHUB_CLIENT_SECRET="xxxxxx"

# GitHub App (Repository Access, Webhooks, Issues & PRs)
GITHUB_APP_ID="123456"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET="your-generated-random-webhook-secret"
GITHUB_APP_NAME="Utility Todo uvpatel"
```

---

## 6. Verification Checklist

1. Navigate to `/settings/integrations`.
2. The GitHub integration card will display **Connected** with account `@uvpatel`.
3. Your authorized repositories will be listed with toggle switches to include them in task synchronization.
4. Visit `/github` to view your workspace overview, open issues, pull requests, CI check runs, and linked tasks.
5. In your task list (`/todo`), open any task details drawer to link it to a GitHub issue or create a new issue directly from the task.
