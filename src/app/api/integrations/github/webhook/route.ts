import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  githubInstallations,
  githubIssueMappings,
  githubRepositories,
  githubWebhookEvents,
} from "@/schema/schema";
import { and, eq } from "drizzle-orm";
import { verifyGitHubWebhookSignature, type GitHubIssueDTO } from "@/lib/integrations/github";
import { syncIssueToTask } from "@/lib/integrations/github-sync";

export async function POST(request: NextRequest) {
  const deliveryId = request.headers.get("x-github-delivery");
  const eventType = request.headers.get("x-github-event");
  const signature = request.headers.get("x-hub-signature-256");

  if (!deliveryId || !eventType) {
    return NextResponse.json(
      { error: "Missing required GitHub webhook headers (X-GitHub-Delivery, X-GitHub-Event)" },
      { status: 400 }
    );
  }

  const rawPayload = await request.text();

  // Verify HMAC-SHA256 signature
  const isValid = verifyGitHubWebhookSignature(rawPayload, signature);
  if (!isValid) {
    console.warn(`[GitHub Webhook] Invalid signature rejected for delivery ${deliveryId}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Check idempotency: deduplicate repeated deliveries
  const [existingEvent] = await db
    .select()
    .from(githubWebhookEvents)
    .where(eq(githubWebhookEvents.deliveryId, deliveryId))
    .limit(1);

  if (existingEvent) {
    return NextResponse.json({
      received: true,
      status: "ignored",
      reason: "duplicate_delivery",
      deliveryId,
    });
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(rawPayload);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const action = typeof payload.action === "string" ? payload.action : null;

  // Persist delivery record in PostgreSQL
  await db.insert(githubWebhookEvents).values({
    id: crypto.randomUUID(),
    deliveryId,
    eventType,
    action,
    payload: rawPayload,
    status: "processed",
  });

  // Track latest webhook event on matching installation
  const installationPayload = payload.installation as { id?: number } | undefined;
  if (installationPayload?.id) {
    const instIdStr = String(installationPayload.id);
    await db
      .update(githubInstallations)
      .set({
        lastWebhookAt: new Date(),
        lastWebhookEvent: action ? `${eventType}.${action}` : eventType,
        updatedAt: new Date(),
      })
      .where(eq(githubInstallations.installationId, instIdStr));
  }

  // Asynchronous idempotent dispatch
  try {
    if (eventType === "installation") {
      const installationId = installationPayload?.id ? String(installationPayload.id) : undefined;

      if (action === "deleted" && installationId) {
        // App was uninstalled on GitHub
        await db
          .delete(githubRepositories)
          .where(eq(githubRepositories.installationId, installationId));

        await db
          .delete(githubInstallations)
          .where(eq(githubInstallations.installationId, installationId));
      }
    } else if (eventType === "installation_repositories") {
      const installationId = installationPayload?.id ? String(installationPayload.id) : undefined;
      const repositoriesRemoved = (payload.repositories_removed as Array<{ id: number }>) || [];

      if (installationId && repositoriesRemoved.length > 0) {
        for (const repo of repositoriesRemoved) {
          await db
            .delete(githubRepositories)
            .where(eq(githubRepositories.githubRepoId, String(repo.id)));
        }
      }
    } else if (eventType === "issues") {
      const issueData = payload.issue as {
        id: number | string;
        number: number;
        title: string;
        body?: string | null;
        state: "open" | "closed";
        html_url: string;
        user?: { login: string };
        assignee?: { login: string } | null;
        labels?: Array<{ name?: string } | string>;
        created_at: string;
        updated_at: string;
      } | undefined;

      const repoData = payload.repository as { full_name?: string } | undefined;

      if (issueData && repoData?.full_name) {
        const repoFullName = repoData.full_name;
        const issueNumber = issueData.number;

        const remoteIssueDTO: GitHubIssueDTO = {
          id: String(issueData.id),
          number: issueData.number,
          title: issueData.title,
          body: issueData.body || null,
          htmlUrl: issueData.html_url,
          state: issueData.state,
          author: issueData.user?.login || "unknown",
          assignee: issueData.assignee?.login || null,
          labels: (issueData.labels || [])
            .map((l) => (typeof l === "string" ? l : l.name || ""))
            .filter(Boolean),
          createdAt: issueData.created_at,
          updatedAt: issueData.updated_at,
        };

        // Find all linked mappings matching this repo and issue
        const matchedMappings = await db
          .select()
          .from(githubIssueMappings)
          .where(
            and(
              eq(githubIssueMappings.repositoryFullName, repoFullName),
              eq(githubIssueMappings.issueNumber, issueNumber)
            )
          );

        for (const mapping of matchedMappings) {
          await syncIssueToTask(mapping.id, remoteIssueDTO, { origin: "webhook" });
        }
      }
    }

    revalidatePath("/github");
    revalidatePath("/settings/integrations");
    revalidatePath("/todo");
  } catch (err) {
    console.error(`[GitHub Webhook] Processing error for ${deliveryId}:`, err);
  }

  return NextResponse.json({
    received: true,
    eventType,
    deliveryId,
    status: "processed",
  });
}
