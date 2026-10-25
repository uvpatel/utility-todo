import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createOAuthState, getGoogleOAuthUrl } from "@/lib/integrations/gmail";

export async function GET(request: NextRequest) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      new URL("/settings/integrations?error=missing_google_credentials", request.url)
    );
  }

  // Create cryptographically signed HMAC state token with 10-minute expiry
  const state = createOAuthState(session.user.id);
  const oauthUrl = getGoogleOAuthUrl(state);

  return NextResponse.redirect(oauthUrl);
}
