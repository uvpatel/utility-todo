import { NextRequest, NextResponse } from "next/server";
import { getGmailMessages } from "@/lib/actions/gmail";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q") || undefined;
    const filter = (searchParams.get("filter") as "all" | "unread" | "actionable") || "all";
    const pageToken = searchParams.get("pageToken") || undefined;

    const data = await getGmailMessages({ search, filter, pageToken });
    return NextResponse.json(data);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
