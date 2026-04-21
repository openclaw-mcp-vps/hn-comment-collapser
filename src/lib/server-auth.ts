import { cookies } from "next/headers";

import { PAYWALL_COOKIE_NAME, SESSION_COOKIE_NAME, verifyPaywallCookieValue } from "@/lib/auth";
import { getUserBySessionToken } from "@/lib/db";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  return getUserBySessionToken(sessionToken);
}

export async function hasPaywallAccess(userId: string) {
  const cookieStore = await cookies();
  const paywallCookie = cookieStore.get(PAYWALL_COOKIE_NAME)?.value;
  return verifyPaywallCookieValue(paywallCookie, userId);
}
