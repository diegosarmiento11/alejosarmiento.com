import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { absoluteUrl, pillarSlugs, postPath } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = (await getAllPosts()).filter((post) => !post.draft);
  const latest = posts[0]?.dateModified;
  return [
    { url: absoluteUrl("/"), lastModified: latest, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/sobre-mi"), changeFrequency: "monthly", priority: 0.8 },
    ...pillarSlugs.map((pilar) => ({
      url: absoluteUrl(`/pilares/${pilar}`),
      lastModified: posts.find((post) => post.pilar === pilar)?.dateModified,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...posts.map((post) => ({
      url: absoluteUrl(postPath(post.slug)),
      lastModified: post.dateModified,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
  ];
}
