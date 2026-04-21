import { NextResponse } from "next/server";

import { PAYWALL_COOKIE_NAME, SESSION_COOKIE_NAME, verifyPaywallCookieValue } from "@/lib/auth";
import { getUserBySessionToken, isUserPaid } from "@/lib/db";

export async function GET(request: Request) {
  const cookieStore = request.headers.get("cookie") ?? "";
  const sessionMatch = cookieStore.match(/(?:^|; )hncc_session=([^;]+)/);
  const paywallMatch = cookieStore.match(/(?:^|; )hncc_paid=([^;]+)/);

  const sessionToken = sessionMatch ? decodeURIComponent(sessionMatch[1]) : "";
  const paywallCookie = paywallMatch ? decodeURIComponent(paywallMatch[1]) : undefined;

  if (!sessionToken) {
    return NextResponse.json({ user: null, paid: false, paywallActive: false });
  }

  const user = await getUserBySessionToken(sessionToken);
  if (!user) {
    const response = NextResponse.json({ user: null, paid: false, paywallActive: false });
    response.cookies.delete(SESSION_COOKIE_NAME);
    response.cookies.delete(PAYWALL_COOKIE_NAME);
    return response;
  }

  return NextResponse.json({
    user,
    paid: isUserPaid(user),
    paywallActive: verifyPaywallCookieValue(paywallCookie, user.id),
  });
}
