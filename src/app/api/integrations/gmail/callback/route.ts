import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { gmailConnections } from "@/schema/schema";
import { eq } from "drizzle-orm";
import {
  encryptToken,
  exchangeCodeForTokens,
  getGoogleUserProfile,
  verifyOAuthState,
} from "@/lib/integrations/gmail";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = new URL("/settings/integrations", request.url);

  if (error || !code) {
    baseUrl.searchParams.set("error", error || "authorization_cancelled");
    return NextResponse.redirect(baseUrl);
  }

  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Validate state parameter to protect against CSRF and replay attacks
  if (!state || !verifyOAuthState(state, session.user.id)) {
    baseUrl.searchParams.set("error", "invalid_state");
    return NextResponse.redirect(baseUrl);
  }

  // Exchange code for tokens
  const tokenData = await exchangeCodeForTokens(code);
  if (!tokenData) {
    baseUrl.searchParams.set("error", "token_exchange_failed");
    return NextResponse.redirect(baseUrl);
  }

  // Retrieve user email from Google profile
  const profile = await getGoogleUserProfile(tokenData.access_token);
  const accountEmail = profile?.email || session.user.email;

  const encryptedAccessToken = encryptToken(tokenData.access_token);
  const encryptedRefreshToken = tokenData.refresh_token
    ? encryptToken(tokenData.refresh_token)
    : null;

  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

  // Check if connection already exists
  const existing = await db
    .select()
    .from(gmailConnections)
    .where(eq(gmailConnections.userId, session.user.id))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(gmailConnections)
      .set({
        providerAccountEmail: accountEmail,
        accessToken: encryptedAccessToken,
        ...(encryptedRefreshToken ? { refreshToken: encryptedRefreshToken } : {}),
        tokenExpiresAt: expiresAt,
        scope: tokenData.scope,
        updatedAt: new Date(),
      })
      .where(eq(gmailConnections.id, existing[0].id));
  } else {
    await db.insert(gmailConnections).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      provider: "gmail",
      providerAccountEmail: accountEmail,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      tokenExpiresAt: expiresAt,
      scope: tokenData.scope,
    });
  }

  baseUrl.searchParams.set("status", "connected");
  return NextResponse.redirect(baseUrl);
}
