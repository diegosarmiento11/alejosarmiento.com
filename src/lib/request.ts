import { randomUUID } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { env } from "./env";

export const VISITOR_COOKIE = "vid";
const ONE_YEAR = 60 * 60 * 24 * 365;

// Used only as a short-lived rate-limit key; never stored or logged.
export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export function readVisitorId(request: NextRequest): string | undefined {
  const value = request.cookies.get(VISITOR_COOKIE)?.value;
  return value && /^[0-9a-f-]{36}$/.test(value) ? value : undefined;
}

export function ensureVisitorId(request: NextRequest): { id: string; isNew: boolean } {
  const existing = readVisitorId(request);
  return existing ? { id: existing, isNew: false } : { id: randomUUID(), isNew: true };
}

export function setVisitorCookie(response: NextResponse, id: string): void {
  response.cookies.set(VISITOR_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    maxAge: ONE_YEAR,
    path: "/",
  });
}

export async function readJson(request: NextRequest): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
