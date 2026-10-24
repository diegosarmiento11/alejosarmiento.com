"use client";

import { Analytics } from "@vercel/analytics/next";
import { OPT_OUT_KEY, shouldTrack } from "@/lib/analytics";

function optedOut(): boolean {
  try {
    return window.localStorage.getItem(OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

export function SiteAnalytics() {
  return <Analytics beforeSend={(event) => (shouldTrack(event.url, optedOut()) ? event : null)} />;
}
