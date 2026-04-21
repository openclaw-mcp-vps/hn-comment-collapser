import { createHmac } from "crypto";

export const SESSION_COOKIE_NAME = "hncc_session";
export const PAYWALL_COOKIE_NAME = "hncc_paid";

const APP_SECRET = process.env.APP_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET ?? "hncc_dev_only_secret";

function sign(payload: string) {
  return createHmac("sha256", APP_SECRET).update(payload).digest("hex");
}

export function createPaywallCookieValue(userId: string, paidUntil: number) {
  const payload = `${userId}.${paidUntil}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifyPaywallCookieValue(value: string | undefined, userId: string) {
  if (!value) {
    return false;
  }

  const [cookieUserId, paidUntilRaw, signature] = value.split(".");
  if (!cookieUserId || !paidUntilRaw || !signature) {
    return false;
  }

  if (cookieUserId !== userId) {
    return false;
  }

  const paidUntil = Number(paidUntilRaw);
  if (!Number.isFinite(paidUntil) || paidUntil <= Date.now()) {
    return false;
  }

  const expected = sign(`${cookieUserId}.${paidUntilRaw}`);
  return signature === expected;
}

export function sessionCookieOptions(expiresAt: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  };
}

export function paywallCookieOptions(paidUntil: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(paidUntil),
  };
}
