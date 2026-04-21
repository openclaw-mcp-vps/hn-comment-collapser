import { NextResponse } from "next/server";

import {
  authenticateUser,
  createSession,
  isUserPaid,
} from "@/lib/db";
import {
  createPaywallCookieValue,
  PAYWALL_COOKIE_NAME,
  paywallCookieOptions,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;

  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const result = await authenticateUser(body.email, body.password);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const session = await createSession(result.user.id);
  const response = NextResponse.json({
    user: result.user,
    paid: isUserPaid(result.user),
  });

  response.cookies.set(SESSION_COOKIE_NAME, session.token, sessionCookieOptions(session.expiresAt));

  if (isUserPaid(result.user) && result.user.paidUntil) {
    response.cookies.set(
      PAYWALL_COOKIE_NAME,
      createPaywallCookieValue(result.user.id, result.user.paidUntil),
      paywallCookieOptions(result.user.paidUntil),
    );
  }

  return response;
}
