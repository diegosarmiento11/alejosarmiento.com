import { notFound } from "next/navigation";
import { OG_IMAGE_ALT } from "@/lib/metadata";
import { OG_SIZE, renderOgImage } from "@/lib/og";
import { getPost, postSlugParams } from "@/lib/blog";
import { pillars } from "@/lib/site";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = OG_IMAGE_ALT;

export function generateStaticParams() {
  return postSlugParams();
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  return renderOgImage({ label: pillars[post.pilar].name, title: post.title });
}
