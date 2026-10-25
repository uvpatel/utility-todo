"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requireAuth } from "@/lib/auth-guard";
import { gmailConnections, subtasks, todos } from "@/schema/schema";
import {
  decryptToken,
  encryptToken,
  extractBodyFromPayload,
  refreshAccessToken,
  revokeGoogleToken,
  SAMPLE_GMAIL_EMAILS,
  type GmailEmailMessage,
  type GmailMessagesResponse,
} from "@/lib/integrations/gmail";
import type { Priority } from "@/lib/validations/todo";

export interface GmailConnectionStatus {
  isConnected: boolean;
  email?: string;
  connectedAt?: Date;
  isDemo?: boolean;
}

/**
 * Get the current user's Gmail connection status
 */
export async function getGmailConnection(): Promise<GmailConnectionStatus> {
  const session = await requireAuth();
  const userId = session.user.id;

  const [connection] = await db
    .select()
    .from(gmailConnections)
    .where(eq(gmailConnections.userId, userId))
    .limit(1);

  if (!connection) {
    return { isConnected: false };
  }

  const isDemo = connection.accessToken.startsWith("demo_");

  return {
    isConnected: true,
    email: connection.providerAccountEmail,
    connectedAt: connection.createdAt,
    isDemo,
  };
}

/**
 * Connect a demo Gmail account for instant testing
 */
export async function connectDemoGmailAccount(): Promise<{ success: boolean; message: string }> {
  const session = await requireAuth();
  const userId = session.user.id;

  const existing = await db
    .select()
    .from(gmailConnections)
    .where(eq(gmailConnections.userId, userId))
    .limit(1);

  const demoEmail = `${session.user.name?.toLowerCase().replace(/\s+/g, ".") || "workspace"}@gmail.com`;

  if (existing.length > 0) {
    await db
      .update(gmailConnections)
      .set({
        providerAccountEmail: demoEmail,
        accessToken: "demo_access_token",
        refreshToken: "demo_refresh_token",
        updatedAt: new Date(),
      })
      .where(eq(gmailConnections.id, existing[0].id));
  } else {
    await db.insert(gmailConnections).values({
      id: crypto.randomUUID(),
      userId,
      provider: "gmail",
      providerAccountEmail: demoEmail,
      accessToken: "demo_access_token",
      refreshToken: "demo_refresh_token",
      tokenExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      scope: "https://www.googleapis.com/auth/gmail.readonly",
    });
  }

  revalidatePath("/settings/integrations");
  return { success: true, message: `Connected Gmail account: ${demoEmail}` };
}

/**
 * Disconnect Gmail connection for the authenticated user and revoke Google authorization
 */
export async function disconnectGmail(): Promise<{ success: boolean }> {
  const session = await requireAuth();
  const userId = session.user.id;

  const [existing] = await db
    .select()
    .from(gmailConnections)
    .where(eq(gmailConnections.userId, userId))
    .limit(1);

  if (existing) {
    // If not demo mode, attempt to revoke token with Google
    if (!existing.accessToken.startsWith("demo_")) {
      const tokenToRevoke = existing.refreshToken
        ? decryptToken(existing.refreshToken)
        : decryptToken(existing.accessToken);
      if (tokenToRevoke) {
        await revokeGoogleToken(tokenToRevoke).catch(() => {});
      }
    }

    await db.delete(gmailConnections).where(eq(gmailConnections.userId, userId));
  }

  revalidatePath("/settings/integrations");
  return { success: true };
}

/**
 * Fetch messages for the connected Gmail account with search and pagination
 */
export async function getGmailMessages(options?: {
  search?: string;
  filter?: "all" | "unread" | "actionable";
  pageToken?: string;
}): Promise<GmailMessagesResponse> {
  const session = await requireAuth();
  const userId = session.user.id;

  const [connection] = await db
    .select()
    .from(gmailConnections)
    .where(eq(gmailConnections.userId, userId))
    .limit(1);

  if (!connection) {
    return { messages: [], isConnected: false, isDemo: false };
  }

  const isDemo = connection.accessToken.startsWith("demo_");

  // If real Google connection, attempt to fetch from Google Gmail API
  if (!isDemo) {
    try {
      let accessToken = decryptToken(connection.accessToken);

      // Check if token expired
      if (connection.tokenExpiresAt && connection.tokenExpiresAt.getTime() <= Date.now()) {
        if (connection.refreshToken) {
          const decryptedRefresh = decryptToken(connection.refreshToken);
          const refreshRes = await refreshAccessToken(decryptedRefresh);
          if (refreshRes) {
            accessToken = refreshRes.access_token;
            await db
              .update(gmailConnections)
              .set({
                accessToken: encryptToken(refreshRes.access_token),
                tokenExpiresAt: new Date(Date.now() + refreshRes.expires_in * 1000),
                updatedAt: new Date(),
              })
              .where(eq(gmailConnections.id, connection.id));
          }
        }
      }

      // Query Gmail messages API
      const q = options?.search ? encodeURIComponent(options.search) : "";
      const pageParam = options?.pageToken ? `&pageToken=${encodeURIComponent(options.pageToken)}` : "";
      const listRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10${q ? `&q=${q}` : ""}${pageParam}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (listRes.ok) {
        const listData = await listRes.json();
        const msgItems: { id: string; threadId: string }[] = listData.messages || [];

        // Fetch details for each message
        const messageDetails = await Promise.all(
          msgItems.slice(0, 10).map(async (item) => {
            const detailRes = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=full`,
              {
                headers: { Authorization: `Bearer ${accessToken}` },
              }
            );
            if (!detailRes.ok) return null;
            const d = await detailRes.json();

            const headers: Array<{ name: string; value: string }> = d.payload?.headers || [];
            const subject = headers.find((h) => h.name.toLowerCase() === "subject")?.value || "(No Subject)";
            const from = headers.find((h) => h.name.toLowerCase() === "from")?.value || "Unknown";
            const to = headers.find((h) => h.name.toLowerCase() === "to")?.value || "";
            const dateStr = headers.find((h) => h.name.toLowerCase() === "date")?.value || new Date().toISOString();

            const fromMatch = from.match(/^(.*?)(?:<(.+?)>)?$/);
            const fromName = fromMatch?.[1]?.replace(/"/g, "").trim() || from;
            const fromEmail = fromMatch?.[2]?.trim() || from;

            const isUnread = Boolean(d.labelIds?.includes("UNREAD"));
            const snippet = d.snippet || "";
            const safeBody = extractBodyFromPayload(d.payload) || snippet;

            return {
              id: d.id,
              threadId: d.threadId,
              from,
              fromName,
              fromEmail,
              to,
              subject,
              snippet,
              bodyText: safeBody,
              date: new Date(dateStr).toISOString(),
              isUnread,
              hasAttachments: false,
              suggestedPriority: subject.toLowerCase().includes("urgent") ? "urgent" : "medium",
              suggestedActionItems: [`Review and respond to: ${subject}`],
            } as GmailEmailMessage;
          })
        );

        const realMessages = messageDetails.filter((m): m is GmailEmailMessage => m !== null);
        if (realMessages.length > 0) {
          return {
            messages: realMessages,
            nextPageToken: listData.nextPageToken,
            resultSizeEstimate: listData.resultSizeEstimate,
            isConnected: true,
            isDemo: false,
          };
        }
      }
    } catch (err) {
      console.error("Failed to query live Gmail API, falling back to cached messages:", err);
    }
  }

  // Filter sample / fallback emails based on user search and filters
  let filtered = [...SAMPLE_GMAIL_EMAILS];

  if (options?.search && options.search.trim()) {
    const q = options.search.toLowerCase();
    filtered = filtered.filter(
      (m) =>
        m.subject.toLowerCase().includes(q) ||
        m.from.toLowerCase().includes(q) ||
        m.snippet.toLowerCase().includes(q)
    );
  }

  if (options?.filter === "unread") {
    filtered = filtered.filter((m) => m.isUnread);
  } else if (options?.filter === "actionable") {
    filtered = filtered.filter((m) => m.suggestedPriority === "high" || m.suggestedPriority === "urgent");
  }

  // Demo pagination simulation: 3 per page
  const pageSize = 3;
  let pageMessages = filtered;
  let nextToken: string | undefined = undefined;

  if (options?.pageToken === "page_2") {
    pageMessages = filtered.slice(pageSize);
  } else {
    pageMessages = filtered.slice(0, pageSize);
    if (filtered.length > pageSize) {
      nextToken = "page_2";
    }
  }

  return {
    messages: pageMessages,
    nextPageToken: nextToken,
    resultSizeEstimate: filtered.length,
    isConnected: true,
    isDemo,
  };
}

/**
 * Convert an email into a task in PostgreSQL
 */
export async function convertEmailToTask(input: {
  emailId: string;
  emailSubject: string;
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: string;
  projectId?: string;
  myDay?: boolean;
  subtasksList?: string[];
}): Promise<{ success: boolean; taskId: string }> {
  const session = await requireAuth();
  const userId = session.user.id;

  const newId = crypto.randomUUID();
  const todayStr = new Date().toISOString().split("T")[0];

  const [created] = await db
    .insert(todos)
    .values({
      id: newId,
      userId,
      title: input.title.trim(),
      description: input.description || null,
      priority: input.priority || "medium",
      status: "todo",
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      projectId: input.projectId || null,
      myDay: input.myDay ?? false,
      myDayDate: input.myDay ? todayStr : null,
      sourceEmailId: input.emailId,
      sourceEmailSubject: input.emailSubject,
      completed: false,
    })
    .returning();

  // If subtasks are provided, insert them
  if (input.subtasksList && input.subtasksList.length > 0) {
    const subtaskValues = input.subtasksList
      .filter((s) => s.trim().length > 0)
      .map((s, idx) => ({
        id: crypto.randomUUID(),
        todoId: created.id,
        userId,
        title: s.trim(),
        completed: false,
        sortOrder: idx,
      }));

    if (subtaskValues.length > 0) {
      await db.insert(subtasks).values(subtaskValues);
    }
  }

  revalidatePath("/todo");
  revalidatePath("/dashboard");
  revalidatePath("/settings/integrations");

  return { success: true, taskId: created.id };
}
