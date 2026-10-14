import { OG_IMAGE_ALT } from "@/lib/metadata";
import { OG_SIZE, renderOgImage } from "@/lib/og";
import { author } from "@/lib/site";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = OG_IMAGE_ALT;

// Shared by every page that has no card of its own: home, /sobre-mi and the rest.
export default function Image() {
  return renderOgImage({ label: "Blog", title: author.tagline });
}
