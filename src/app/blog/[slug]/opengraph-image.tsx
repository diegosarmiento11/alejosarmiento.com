import { notFound } from "next/navigation";
import { renderPostImage } from "@/lib/og";
import { getAllPosts, getPost } from "@/lib/posts";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Post de Alejandro Sarmiento";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  return renderPostImage(post, "og");
}
