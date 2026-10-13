import { type NextRequest, NextResponse } from "next/server";
import { allowRequest, getSiteVisits, recordSiteVisit } from "@/lib/engagement";
import { clientIp } from "@/lib/request";
import { getStore } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ visits: await getSiteVisits(getStore()) });
}

export async function POST(request: NextRequest) {
  const store = getStore();
  const allowed = await allowRequest(store, "visits", clientIp(request), {
    limit: 20,
    windowSeconds: 3600,
    now: new Date(),
  });
  const visits = allowed ? await recordSiteVisit(store) : await getSiteVisits(store);
  return NextResponse.json({ visits });
}
