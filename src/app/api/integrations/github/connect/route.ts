import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createGitHubOAuthState, getGitHubConnectUrl } from "@/lib/integrations/github";

export async function GET(request: NextRequest) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Create cryptographically signed HMAC state token with 10-minute expiry
  const state = createGitHubOAuthState(session.user.id);
  const connectUrl = getGitHubConnectUrl(state);

  return NextResponse.redirect(connectUrl);
}
