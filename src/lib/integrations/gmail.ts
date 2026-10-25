import crypto from "crypto";

export interface GmailEmailMessage {
  id: string;
  threadId: string;
  from: string;
  fromName: string;
  fromEmail: string;
  to: string;
  subject: string;
  snippet: string;
  bodyText: string;
  date: string;
  isUnread: boolean;
  hasAttachments: boolean;
  suggestedPriority: "low" | "medium" | "high" | "urgent";
  suggestedDueDate?: string;
  suggestedActionItems: string[];
}

export interface GmailMessagesResponse {
  messages: GmailEmailMessage[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
  isConnected: boolean;
  isDemo: boolean;
}

// AES-256-GCM encryption helpers
function getEncryptionKey(): Buffer {
  const secret = process.env.BETTER_AUTH_SECRET || "utility-todo-secure-secret-key-default-32";
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptToken(token: string): string {
  try {
    const iv = crypto.randomBytes(12);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    let encrypted = cipher.update(token, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error("Encryption error:", err);
    return token;
  }
}

export function decryptToken(encryptedData: string): string {
  try {
    const parts = encryptedData.split(":");
    if (parts.length !== 3) return encryptedData;
    const [ivHex, authTagHex, encryptedText] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Decryption error:", err);
    return encryptedData;
  }
}

// HMAC-Signed OAuth State Generation & Timing-Safe Verification
export function createOAuthState(userId: string): string {
  const secret = process.env.BETTER_AUTH_SECRET || "utility-todo-state-secret-default";
  const payload = JSON.stringify({
    userId,
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString("hex"),
  });
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}.${hmac}`).toString("base64url");
}

export function verifyOAuthState(state: string, expectedUserId: string): boolean {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const dotIndex = decoded.lastIndexOf(".");
    if (dotIndex === -1) return false;

    const payloadStr = decoded.substring(0, dotIndex);
    const signature = decoded.substring(dotIndex + 1);
    if (!payloadStr || !signature) return false;

    const secret = process.env.BETTER_AUTH_SECRET || "utility-todo-state-secret-default";
    const expectedSig = crypto.createHmac("sha256", secret).update(payloadStr).digest("hex");

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return false;
    }

    const payload = JSON.parse(payloadStr);
    if (payload.userId !== expectedUserId) return false;

    // Reject state older than 10 minutes to mitigate replay
    const tenMinutesMs = 10 * 60 * 1000;
    if (Date.now() - payload.timestamp > tenMinutesMs) return false;

    return true;
  } catch {
    return false;
  }
}

export function getRedirectUri(): string {
  const baseUrl =
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/api/integrations/gmail/callback`;
}

export function getGoogleOAuthUrl(state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return "";
  }

  const redirectUri = getRedirectUri();
  // Request minimum scopes necessary for reading emails & profile email
  const scopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
} | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = getRedirectUri();

  if (!clientId || !clientSecret) {
    console.warn("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured.");
    return null;
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error exchanging code for tokens:", errorText);
    return null;
  }

  return await response.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
} | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    console.error("Failed to refresh Gmail access token:", await response.text());
    return null;
  }

  return await response.json();
}

export async function revokeGoogleToken(token: string): Promise<boolean> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }),
    });
    return response.ok;
  } catch (err) {
    console.warn("Google token revocation request failed:", err);
    return false;
  }
}

export async function getGoogleUserProfile(accessToken: string): Promise<{
  email: string;
  name?: string;
  picture?: string;
} | null> {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    console.error("Failed to fetch Google user profile");
    return null;
  }

  return await response.json();
}

// Untrusted HTML Sanitizer to extract safe plain text
export function sanitizeHtmlToText(html: string): string {
  if (!html) return "";
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  text = text.replace(/<(?:br|\/p|\/div|\/tr)>/gi, "\n");
  text = text.replace(/<[^>]+>/g, "");
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
  return text.trim();
}

export interface GmailPayloadPart {
  mimeType?: string;
  body?: {
    data?: string;
    size?: number;
  };
  parts?: GmailPayloadPart[];
}

// Recursive parser to safely extract text from Gmail API message payload
export function extractBodyFromPayload(payload?: GmailPayloadPart | null): string {
  if (!payload) return "";

  if (payload.body?.data) {
    try {
      const decoded = Buffer.from(payload.body.data, "base64url").toString("utf8");
      if (payload.mimeType === "text/html") {
        return sanitizeHtmlToText(decoded);
      }
      return decoded.trim();
    } catch {
      // ignore decoding error
    }
  }

  if (payload.parts && Array.isArray(payload.parts)) {
    // 1. Prefer text/plain part
    const plainPart = payload.parts.find((p) => p.mimeType === "text/plain");
    if (plainPart?.body?.data) {
      try {
        return Buffer.from(plainPart.body.data, "base64url").toString("utf8").trim();
      } catch {
        // ignore
      }
    }

    // 2. Secondary text/html part
    const htmlPart = payload.parts.find((p) => p.mimeType === "text/html");
    if (htmlPart?.body?.data) {
      try {
        const decoded = Buffer.from(htmlPart.body.data, "base64url").toString("utf8");
        return sanitizeHtmlToText(decoded);
      } catch {
        // ignore
      }
    }

    // 3. Recursive subparts
    for (const part of payload.parts) {
      const extracted = extractBodyFromPayload(part);
      if (extracted) return extracted;
    }
  }

  return "";
}

// Fallback / Sample Realistic Emails for testing and demo purposes
export const SAMPLE_GMAIL_EMAILS: GmailEmailMessage[] = [
  {
    id: "gmail_sample_01",
    threadId: "th_01",
    from: "Sarah Chen <sarah.chen@acme-corp.com>",
    fromName: "Sarah Chen",
    fromEmail: "sarah.chen@acme-corp.com",
    to: "me@utilitytodo.com",
    subject: "Action Required: Q4 Product Architecture Review & Migration",
    snippet:
      "Hi team, following our discussion on Wednesday, we need to finalize the PostgreSQL schema migration and confirm the API rate limits before Friday...",
    bodyText: `Hi team,

Following our engineering discussion on Wednesday, we need to finalize the PostgreSQL schema migration and confirm the API rate limits before this Friday at 5:00 PM EST.

Key items that need attention:
1. Review Drizzle ORM foreign key cascading behavior
2. Audit index performance for the todos table
3. Confirm backup schedule with the infrastructure team

Please let me know once you have reviewed the proposed checklist.

Best,
Sarah Chen
VP of Engineering, Acme Corp`,
    date: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    isUnread: true,
    hasAttachments: true,
    suggestedPriority: "high",
    suggestedDueDate: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString().split("T")[0],
    suggestedActionItems: [
      "Review Drizzle ORM foreign key cascading behavior",
      "Audit index performance for the todos table",
      "Confirm backup schedule with the infrastructure team",
    ],
  },
  {
    id: "gmail_sample_02",
    threadId: "th_02",
    from: "Marcus Vance <marcus@stripe-partners.com>",
    fromName: "Marcus Vance",
    fromEmail: "marcus@stripe-partners.com",
    to: "me@utilitytodo.com",
    subject: "Urgent: Update Payment Gateway Webhook Endpoint by EOD",
    snippet:
      "We noticed webhook retries on your staging environment. Please ensure the endpoint responds with 200 OK within 3 seconds to avoid event throttling...",
    bodyText: `Hello team,

We noticed webhook retries on your staging environment during peak traffic tests today.

Please ensure your webhook endpoint responds with HTTP 200 OK within 3 seconds to avoid event throttling. If you need assistance verifying test signatures, check our latest documentation or reach out here.

Deadline: Today before 6:00 PM.

Regards,
Marcus Vance
Partner Integrations Team`,
    date: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    isUnread: true,
    hasAttachments: false,
    suggestedPriority: "urgent",
    suggestedDueDate: new Date().toISOString().split("T")[0],
    suggestedActionItems: [
      "Verify webhook response time is under 3 seconds",
      "Check retry handler logs on staging",
      "Send confirmation reply to Marcus Vance",
    ],
  },
  {
    id: "gmail_sample_03",
    threadId: "th_03",
    from: "Elena Rostova <elena.rostova@designworks.io>",
    fromName: "Elena Rostova",
    fromEmail: "elena.rostova@designworks.io",
    to: "me@utilitytodo.com",
    subject: "Figma Design System Updates: Dark Mode Tokens & Spacing",
    snippet:
      "The updated dark mode color variables and card elevation tokens are ready for review in Figma. Please take a look and approve when ready...",
    bodyText: `Hey there,

The updated dark mode color variables and card elevation tokens are ready for engineering review in the design file.

Highlights:
- Updated NotionInter font weights and line heights
- Refined contrast ratios for secondary muted text
- Standardized 8px and 12px border radiuses across all modals

Whenever you get a chance this week, take a look and let us know if there are any CSS token discrepancies.

Cheers,
Elena Rostova
Lead Product Designer`,
    date: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    isUnread: false,
    hasAttachments: true,
    suggestedPriority: "medium",
    suggestedDueDate: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString().split("T")[0],
    suggestedActionItems: [
      "Inspect Figma dark mode token definitions",
      "Compare CSS variables with design specification",
      "Leave feedback in the Figma comments",
    ],
  },
  {
    id: "gmail_sample_04",
    threadId: "th_04",
    from: "Billing & Accounts <no-reply@aws-alerts.amazon.com>",
    fromName: "AWS Billing",
    fromEmail: "no-reply@aws-alerts.amazon.com",
    to: "me@utilitytodo.com",
    subject: "Monthly Statement Available: Account #277415659952",
    snippet:
      "Your AWS invoice for the previous billing period is now available in the AWS Management Console. No immediate action required...",
    bodyText: `Dear AWS Customer,

Your monthly invoice for account #277415659952 is now available for download.

Total Amount: $42.18
Payment Method: Visa ending in 4012
Status: Paid

To download your tax invoice or view billing breakdown, visit the Billing and Cost Management console.`,
    date: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    isUnread: false,
    hasAttachments: false,
    suggestedPriority: "low",
    suggestedActionItems: [
      "Archive invoice in financial records folder",
    ],
  },
  {
    id: "gmail_sample_05",
    threadId: "th_05",
    from: "David Kross <david@venturecap.com>",
    fromName: "David Kross",
    fromEmail: "david@venturecap.com",
    to: "me@utilitytodo.com",
    subject: "Follow up: Utility Todo Product Demo & Enterprise Roadmap",
    snippet:
      "Thanks for the demo call yesterday! The team was very impressed by the live dashboard throughput metrics. Could you send over the security whitepaper?",
    bodyText: `Hi there,

Thanks for taking the time to demo Utility Todo yesterday! Our team was particularly impressed with the live task throughput analytics and the clean Notion-like workspace.

Could you share:
1. Your security and compliance whitepaper
2. Single-sign-on (SSO) and SAML pricing tier
3. Timeline for two-way email synchronization

Looking forward to our follow-up call next Tuesday at 10:00 AM PST.

Best regards,
David Kross
General Partner`,
    date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    isUnread: true,
    hasAttachments: false,
    suggestedPriority: "high",
    suggestedDueDate: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString().split("T")[0],
    suggestedActionItems: [
      "Send security & compliance whitepaper to David Kross",
      "Draft SSO/SAML pricing overview",
      "Add follow-up call to calendar for Tuesday 10:00 AM PST",
    ],
  },
];

// Heuristic action item extractor for emails
export function extractActionItemsFromEmail(subject: string, body: string): {
  cleanTitle: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
  actionItems: string[];
} {
  const lowerSub = subject.toLowerCase();
  const lowerBody = body.toLowerCase();

  let cleanTitle = subject
    .replace(/^(re|fwd|fw|action required|urgent|alert):\s*/i, "")
    .trim();

  if (!cleanTitle.startsWith("Review") && !cleanTitle.startsWith("Update") && !cleanTitle.startsWith("Follow up")) {
    cleanTitle = `Review: ${cleanTitle}`;
  }

  let priority: "low" | "medium" | "high" | "urgent" = "medium";
  if (lowerSub.includes("urgent") || lowerBody.includes("urgent") || lowerBody.includes("asap") || lowerSub.includes("by eod")) {
    priority = "urgent";
  } else if (lowerSub.includes("action required") || lowerSub.includes("review") || lowerBody.includes("deadline")) {
    priority = "high";
  } else if (lowerSub.includes("statement") || lowerSub.includes("newsletter") || lowerSub.includes("receipt")) {
    priority = "low";
  }

  let dueDate: string | undefined = undefined;
  if (lowerSub.includes("by eod") || lowerBody.includes("today")) {
    dueDate = new Date().toISOString().split("T")[0];
  } else if (lowerBody.includes("tomorrow")) {
    const tm = new Date();
    tm.setDate(tm.getDate() + 1);
    dueDate = tm.toISOString().split("T")[0];
  } else if (lowerBody.includes("friday")) {
    const d = new Date();
    const day = d.getDay();
    const diff = (5 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    dueDate = d.toISOString().split("T")[0];
  }

  const lines = body.split("\n");
  const actionItems: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const numberedMatch = trimmed.match(/^\d+[\.\)]\s*(.+)/);
    const bulletMatch = trimmed.match(/^[-*•]\s*(.+)/);

    if (numberedMatch && numberedMatch[1].length > 5) {
      actionItems.push(numberedMatch[1].trim());
    } else if (bulletMatch && bulletMatch[1].length > 5) {
      actionItems.push(bulletMatch[1].trim());
    }

    if (actionItems.length >= 4) break;
  }

  if (actionItems.length === 0) {
    actionItems.push(`Review and respond to ${cleanTitle}`);
  }

  return { cleanTitle, priority, dueDate, actionItems };
}
