import { NextResponse } from "next/server";

import { corsPreflight, withCors } from "@/lib/cors";
import { CommentStateUpdateInput, getUserByExtensionToken, isUserPaid, syncCommentStates } from "@/lib/db";

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return "";
  }
  return authHeader.slice("Bearer ".length).trim();
}

async function authenticateExtensionRequest(request: Request) {
  const token = getBearerToken(request);
  if (!token) {
    return { error: "Missing Bearer token." } as const;
  }

  const auth = await getUserByExtensionToken(token);
  if (!auth) {
    return { error: "Invalid extension token." } as const;
  }

  if (!isUserPaid(auth.user)) {
    return { error: "Subscription inactive." } as const;
  }

  return auth;
}

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET(request: Request) {
  const auth = await authenticateExtensionRequest(request);
  if ("error" in auth) {
    return withCors(NextResponse.json({ error: auth.error }, { status: 401 }));
  }

  const states = await syncCommentStates(auth.user.id, auth.deviceId, []);

  return withCors(
    NextResponse.json({
      states,
      serverTime: Date.now(),
    }),
  );
}

export async function POST(request: Request) {
  const auth = await authenticateExtensionRequest(request);
  if ("error" in auth) {
    return withCors(NextResponse.json({ error: auth.error }, { status: 401 }));
  }

  const body = (await request.json().catch(() => null)) as
    | {
        deviceId?: string;
        updates?: CommentStateUpdateInput[];
      }
    | null;

  const updates = Array.isArray(body?.updates) ? body?.updates : [];
  const deviceId = body?.deviceId?.slice(0, 100) || auth.deviceId;

  const states = await syncCommentStates(auth.user.id, deviceId, updates);

  return withCors(
    NextResponse.json({
      states,
      serverTime: Date.now(),
    }),
  );
}
