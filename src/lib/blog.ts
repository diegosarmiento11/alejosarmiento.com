import { cacheLife, cacheTag } from "next/cache";
import { env } from "./env";
import { loadPosts, type Post, relatedPosts } from "./posts";
import { getStore } from "./store";

// Cached reads for pages. Publishing from /escribir revalidates POSTS_TAG, so
// pages stay static until a post changes (ADR 0008).
export const POSTS_TAG = "posts";

// Drafts are visible in development only.
export async function getAllPosts(): Promise<Post[]> {
  "use cache";
  cacheTag(POSTS_TAG);
  cacheLife("max");
  return loadPosts(getStore(), { includeDrafts: !env.isProduction });
}

export async function getPost(slug: string): Promise<Post | undefined> {
  return (await getAllPosts()).find((post) => post.slug === slug);
}

export async function getPostsByPillar(pilar: string): Promise<Post[]> {
  return (await getAllPosts()).filter((post) => post.pilar === pilar);
}

export async function getRelatedPosts(post: Post, limit = 3): Promise<Post[]> {
  return relatedPosts(post, await getAllPosts(), limit);
}

// Cache Components refuses an empty generateStaticParams, so with no posts yet
// the build prerenders one placeholder slug that renders the not-found page.
export const NO_POSTS_SLUG = "sin-posts";

export async function postSlugParams(): Promise<{ slug: string }[]> {
  const posts = await getAllPosts();
  return posts.length > 0 ? posts.map((post) => ({ slug: post.slug })) : [{ slug: NO_POSTS_SLUG }];
}
