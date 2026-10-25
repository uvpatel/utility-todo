import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { disconnectGitHub } from "@/lib/actions/github";

export async function POST() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await disconnectGitHub();
    return NextResponse.json({ success: true, message: "GitHub disconnected" });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to disconnect GitHub" },
      { status: 500 }
    );
  }
}
