import matter from "gray-matter";
import { z } from "zod";
import { env } from "./env";
import { DESCRIPTION_MAX, SLUG_PATTERN, TITLE_MAX } from "./post-format";
import { pillarSlugs } from "./site";
import type { Store } from "./store";

export { DESCRIPTION_MAX, SLUG_PATTERN, TITLE_MAX };

const isoDate = z
  .union([z.string(), z.date()])
  .transform((value) =>
    value instanceof Date ? value.toISOString().slice(0, 10) : value,
  )
  .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "usa el formato AAAA-MM-DD"));

export const frontmatterSchema = z.object({
  title: z.string().min(10).max(TITLE_MAX),
  description: z.string().min(50).max(DESCRIPTION_MAX),
  datePublished: isoDate,
  dateModified: isoDate,
  pilar: z.enum(pillarSlugs),
  keywords: z.array(z.string().min(2)).min(3).max(6),
  faq: z
    .array(z.object({ question: z.string().min(8), answer: z.string().min(20) }))
    .min(3)
    .max(5),
  video: z
    .object({
      url: z.url(),
      name: z.string().optional(),
      uploadDate: isoDate,
      durationSeconds: z.number().int().positive().optional(),
    })
    .optional(),
  draft: z.boolean().default(false),
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;

export type Post = Frontmatter & {
  slug: string;
  content: string;
  readingMinutes: number;
};

export function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function parsePost(slug: string, raw: string): Post {
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error(
      `Slug inválido "${slug}": solo minúsculas, números y guiones.`,
    );
  }
  const { data, content } = matter(raw);
  const parsed = frontmatterSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "frontmatter"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Frontmatter inválido en "${slug}":\n${issues}`);
  }
  return {
    ...parsed.data,
    slug,
    content,
    readingMinutes: readingMinutes(content),
  };
}

// Posts live in the store (Redis in production): one hash field per slug holding
// the full MDX source, frontmatter included (ADR 0008). Every save keeps the
// previous version in a per-post history hash, keyed by the time it was replaced.
export const POSTS_KEY = "posts";
export const postHistoryKey = (slug: string) => `posts:history:${slug}`;

export type PostLoad = { posts: Post[]; errors: string[] };

function byDate(a: Post, b: Post): number {
  return b.datePublished.localeCompare(a.datePublished) || a.slug.localeCompare(b.slug);
}

// An invalid post is reported, not thrown, so one bad entry cannot take the site down.
export async function readPosts(
  store: Store,
  { includeDrafts = false }: { includeDrafts?: boolean } = {},
): Promise<PostLoad> {
  const sources = await store.hgetall(POSTS_KEY);
  const posts: Post[] = [];
  const errors: string[] = [];
  for (const [slug, source] of Object.entries(sources)) {
    try {
      const post = parsePost(slug, source);
      if (includeDrafts || !post.draft) posts.push(post);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  return { posts: posts.sort(byDate), errors };
}

export async function loadPosts(
  store: Store,
  options: { includeDrafts?: boolean } = {},
): Promise<Post[]> {
  const { posts, errors } = await readPosts(store, options);
  for (const error of errors) console.error(`[posts] ${error}`);
  return posts;
}

export async function getPostSource(store: Store, slug: string): Promise<string | null> {
  return store.hget(POSTS_KEY, slug);
}

// Reads one post straight from the store, skipping caches. Drafts count only outside production.
export async function findPost(store: Store, slug: string): Promise<Post | undefined> {
  if (!SLUG_PATTERN.test(slug)) return undefined;
  const source = await getPostSource(store, slug);
  if (!source) return undefined;
  try {
    const post = parsePost(slug, source);
    return post.draft && env.isProduction ? undefined : post;
  } catch {
    return undefined;
  }
}

export async function postExists(store: Store, slug: string): Promise<boolean> {
  return (await findPost(store, slug)) !== undefined;
}

export async function savePost(
  store: Store,
  slug: string,
  source: string,
  now: Date,
): Promise<void> {
  parsePost(slug, source);
  const previous = await getPostSource(store, slug);
  if (previous !== null && previous !== source) {
    await store.hset(postHistoryKey(slug), now.toISOString(), previous);
  }
  await store.hset(POSTS_KEY, slug, source);
}

// The deleted source stays in the post's history, so a mistaken delete can be undone.
export async function deletePost(store: Store, slug: string, now: Date): Promise<boolean> {
  const previous = await getPostSource(store, slug);
  if (previous === null) return false;
  await store.hset(postHistoryKey(slug), now.toISOString(), previous);
  await store.hdel(POSTS_KEY, slug);
  return true;
}

export function relatedPosts(post: Post, all: Post[], limit = 3): Post[] {
  const others = all.filter((other) => other.slug !== post.slug);
  const samePillar = others.filter((other) => other.pilar === post.pilar);
  const rest = others.filter((other) => other.pilar !== post.pilar);
  return [...samePillar, ...rest].slice(0, limit);
}

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDate(isoDay: string): string {
  return dateFormatter.format(new Date(`${isoDay}T00:00:00Z`));
}
