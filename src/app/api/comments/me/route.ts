import { NextResponse } from "next/server";

import { PAYWALL_COOKIE_NAME, SESSION_COOKIE_NAME, verifyPaywallCookieValue } from "@/lib/auth";
import { getDashboardStats, getUserBySessionToken, getUserCollapsedStates, setUserCommentState } from "@/lib/db";

async function requirePaidSession(request: Request) {
  const cookieStore = request.headers.get("cookie") ?? "";
  const sessionMatch = cookieStore.match(/(?:^|; )hncc_session=([^;]+)/);
  const paywallMatch = cookieStore.match(/(?:^|; )hncc_paid=([^;]+)/);

  const sessionToken = sessionMatch ? decodeURIComponent(sessionMatch[1]) : "";
  const paywallToken = paywallMatch ? decodeURIComponent(paywallMatch[1]) : undefined;

  if (!sessionToken) {
    return { error: "Authentication required." } as const;
  }

  const user = await getUserBySessionToken(sessionToken);
  if (!user) {
    return { error: "Session expired." } as const;
  }

  if (!verifyPaywallCookieValue(paywallToken, user.id)) {
    return { error: "Paid access required." } as const;
  }

  return { user };
}

export async function GET(request: Request) {
  const auth = await requirePaidSession(request);
  if ("error" in auth) {
    const response = NextResponse.json({ error: auth.error }, { status: 401 });
    response.cookies.delete(SESSION_COOKIE_NAME);
    response.cookies.delete(PAYWALL_COOKIE_NAME);
    return response;
  }

  const [records, stats] = await Promise.all([
    getUserCollapsedStates(auth.user.id),
    getDashboardStats(auth.user.id),
  ]);

  return NextResponse.json({ records, stats });
}

export async function PATCH(request: Request) {
  const auth = await requirePaidSession(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        commentKey?: string;
        collapsed?: boolean;
      }
    | null;

  if (!body?.commentKey || typeof body.collapsed !== "boolean") {
    return NextResponse.json({ error: "commentKey and collapsed are required." }, { status: 400 });
  }

  await setUserCommentState(auth.user.id, body.commentKey, body.collapsed);

  const [records, stats] = await Promise.all([
    getUserCollapsedStates(auth.user.id),
    getDashboardStats(auth.user.id),
  ]);

  return NextResponse.json({ records, stats });
}
