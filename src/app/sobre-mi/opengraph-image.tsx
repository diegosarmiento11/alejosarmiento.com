import { OG_IMAGE_ALT } from "@/lib/metadata";
import { OG_SIZE, renderOgImage } from "@/lib/og";
import { author } from "@/lib/site";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = OG_IMAGE_ALT;

// The page sets its own `openGraph`, which drops the root card; it needs its own.
export default function Image() {
  return renderOgImage({ label: "Sobre mí", title: author.tagline });
}
