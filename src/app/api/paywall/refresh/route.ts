import { NextResponse } from "next/server";

import {
  createPaywallCookieValue,
  PAYWALL_COOKIE_NAME,
  paywallCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import { getUserBySessionToken, isUserPaid, refreshUserPaidState } from "@/lib/db";

export async function POST(request: Request) {
  const cookieStore = request.headers.get("cookie") ?? "";
  const sessionMatch = cookieStore.match(/(?:^|; )hncc_session=([^;]+)/);
  const sessionToken = sessionMatch ? decodeURIComponent(sessionMatch[1]) : "";

  if (!sessionToken) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  const user = await getUserBySessionToken(sessionToken);

  if (!user) {
    const response = NextResponse.json({ error: "Session expired." }, { status: 401 });
    response.cookies.delete(SESSION_COOKIE_NAME);
    response.cookies.delete(PAYWALL_COOKIE_NAME);
    return response;
  }

  const refreshed = await refreshUserPaidState(user.id);

  if (!refreshed || !isUserPaid(refreshed) || !refreshed.paidUntil) {
    return NextResponse.json(
      {
        paid: false,
        message:
          "No active subscription found for this account yet. If you just paid, wait 10-20 seconds and try again.",
      },
      { status: 402 },
    );
  }

  const response = NextResponse.json({ paid: true, paidUntil: refreshed.paidUntil });
  response.cookies.set(
    PAYWALL_COOKIE_NAME,
    createPaywallCookieValue(refreshed.id, refreshed.paidUntil),
    paywallCookieOptions(refreshed.paidUntil),
  );

  return response;
}
