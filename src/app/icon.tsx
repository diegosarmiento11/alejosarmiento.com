import { renderIcon } from "@/lib/og";

// Google only shows favicons whose side is a multiple of 48 px; the larger two
// are the ones the web manifest lists.
const ICON_SIZES = [96, 192, 512] as const;

export function generateImageMetadata() {
  return ICON_SIZES.map((side) => ({
    id: String(side),
    size: { width: side, height: side },
    contentType: "image/png",
  }));
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  return renderIcon(Number(await id), "round");
}
