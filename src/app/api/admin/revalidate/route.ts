import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { adminPassword, passwordMatches } from "@/lib/admin-session";
import { POSTS_TAG } from "@/lib/blog";
import { allowRequest } from "@/lib/engagement";
import { clientIp } from "@/lib/request";
import { getStore } from "@/lib/store";

// Called by `pnpm run posts:push` after it writes to Redis, so the site shows the change.
export async function POST(request: NextRequest) {
  const allowed = await allowRequest(getStore(), "admin-revalidate", clientIp(request), {
    limit: 5,
    windowSeconds: 900,
    now: new Date(),
  });
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!allowed || !adminPassword || !passwordMatches(token, adminPassword)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  revalidateTag(POSTS_TAG, { expire: 0 });
  return NextResponse.json({ revalidated: true });
}
