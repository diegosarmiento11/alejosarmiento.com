import { notFound } from "next/navigation";
import { OG_IMAGE_ALT } from "@/lib/metadata";
import { OG_SIZE, renderOgImage } from "@/lib/og";
import { pillars, pillarSlugs, type PillarSlug } from "@/lib/site";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = OG_IMAGE_ALT;

export function generateStaticParams() {
  return pillarSlugs.map((pilar) => ({ pilar }));
}

export default async function Image({ params }: { params: Promise<{ pilar: string }> }) {
  const { pilar } = await params;
  if (!(pilar in pillars)) notFound();
  return renderOgImage({ label: "Tema", title: pillars[pilar as PillarSlug].name });
}
