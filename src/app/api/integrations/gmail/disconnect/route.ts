import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { gmailConnections } from "@/schema/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.delete(gmailConnections).where(eq(gmailConnections.userId, session.user.id));

  return NextResponse.json({ success: true, message: "Gmail disconnected" });
}
