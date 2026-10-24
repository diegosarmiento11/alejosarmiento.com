import { SITE_URL } from "./site";

// Set on a device once the author signs in to /escribir, so their own visits
// stay out of Vercel Web Analytics on every page, not only the editor.
export const OPT_OUT_KEY = "analytics:excluir";

// Whether a page view should reach Vercel Web Analytics.
export function shouldTrack(url: string, optedOut: boolean): boolean {
  if (optedOut) return false;
  const path = new URL(url, SITE_URL).pathname;
  return path !== "/escribir" && !path.startsWith("/escribir/");
}

// Where a post gets shared. Instagram's in-app browser often drops the
// referrer, so the UTM tags are what tell those readers apart.
export const shareChannels = [
  { label: "Instagram, historia", source: "instagram", medium: "historia" },
  { label: "Instagram, bio", source: "instagram", medium: "bio" },
  { label: "LinkedIn", source: "linkedin", medium: "post" },
  { label: "WhatsApp", source: "whatsapp", medium: "mensaje" },
] as const;

export type ShareChannel = (typeof shareChannels)[number];

export function shareUrl(slug: string, channel: Pick<ShareChannel, "source" | "medium">): string {
  const url = new URL(`/blog/${slug}`, SITE_URL);
  url.searchParams.set("utm_source", channel.source);
  url.searchParams.set("utm_medium", channel.medium);
  return url.toString();
}
