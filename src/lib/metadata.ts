import { author, site } from "./site";

// Next replaces `openGraph` wholesale when a page defines its own, so every page
// that does spreads this in to keep the site name and locale.
export const openGraphDefaults = {
  siteName: site.name,
  locale: site.locale,
} as const;

export const OG_IMAGE_ALT = `Alejandro Sarmiento, ${author.identityLine}`;
