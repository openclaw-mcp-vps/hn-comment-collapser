import { NextResponse } from "next/server";

import { withCors, corsPreflight } from "@/lib/cors";
import { authenticateUser, createExtensionToken, isUserPaid } from "@/lib/db";

export async function OPTIONS() {
  return corsPreflight();
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { email?: string; password?: string; deviceId?: string }
    | null;

  if (!body?.email || !body?.password) {
    return withCors(NextResponse.json({ error: "Email and password are required." }, { status: 400 }));
  }

  const auth = await authenticateUser(body.email, body.password);
  if ("error" in auth) {
    return withCors(NextResponse.json({ error: auth.error }, { status: 401 }));
  }

  if (!isUserPaid(auth.user)) {
    return withCors(
      NextResponse.json(
        {
          error: "An active subscription is required before extension sync is enabled.",
        },
        { status: 402 },
      ),
    );
  }

  const deviceId = body.deviceId?.slice(0, 100) || "browser-extension";
  const token = await createExtensionToken(auth.user.id, deviceId);

  return withCors(
    NextResponse.json({
      token,
      user: auth.user,
      paidUntil: auth.user.paidUntil,
    }),
  );
}
