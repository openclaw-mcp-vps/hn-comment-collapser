import { NextResponse } from "next/server";

export function withCors(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  return response;
}

export function corsPreflight() {
  return withCors(new NextResponse(null, { status: 204 }));
}
