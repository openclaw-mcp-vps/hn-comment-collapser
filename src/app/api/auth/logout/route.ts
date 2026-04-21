import { NextResponse } from "next/server";

import { deleteSession } from "@/lib/db";
import { PAYWALL_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  const cookieStore = request.headers.get("cookie") ?? "";
  const sessionMatch = cookieStore.match(/(?:^|; )hncc_session=([^;]+)/);
  const sessionToken = sessionMatch ? decodeURIComponent(sessionMatch[1]) : "";

  if (sessionToken) {
    await deleteSession(sessionToken);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  response.cookies.delete(PAYWALL_COOKIE_NAME);

  return response;
}
