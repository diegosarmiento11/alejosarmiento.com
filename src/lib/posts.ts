import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { env } from "./env";
import { pillarSlugs } from "./site";

export const POSTS_DIR = path.join(process.cwd(), "content", "blog");

export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;

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

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
    throw new Error(`Frontmatter inválido en "${slug}.mdx":\n${issues}`);
  }
  return {
    ...parsed.data,
    slug,
    content,
    readingMinutes: readingMinutes(content),
  };
}

// Paths are spelled out from process.cwd() so the bundler traces only content/blog
// into the server functions that read posts at request time.
export function listPostFiles(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(path.join(process.cwd(), "content", "blog"))
    .filter((file) => file.endsWith(".mdx") && !file.startsWith("_"));
}

export function loadPosts({ includeDrafts = false }: { includeDrafts?: boolean } = {}): Post[] {
  return listPostFiles()
    .map((file) =>
      parsePost(
        file.replace(/\.mdx$/, ""),
        fs.readFileSync(path.join(process.cwd(), "content", "blog", file), "utf8"),
      ),
    )
    .filter((post) => includeDrafts || !post.draft)
    .sort(
      (a, b) =>
        b.datePublished.localeCompare(a.datePublished) ||
        a.slug.localeCompare(b.slug),
    );
}

let cached: Post[] | undefined;

// Drafts are visible in development only.
export function getAllPosts(): Post[] {
  if (cached && env.isProduction) return cached;
  cached = loadPosts({ includeDrafts: !env.isProduction });
  return cached;
}

export function getPost(slug: string): Post | undefined {
  return getAllPosts().find((post) => post.slug === slug);
}

export function postExists(slug: string): boolean {
  return getPost(slug) !== undefined;
}

export function getPostsByPillar(pilar: string): Post[] {
  return getAllPosts().filter((post) => post.pilar === pilar);
}

export function getRelatedPosts(post: Post, limit = 3): Post[] {
  const others = getAllPosts().filter((other) => other.slug !== post.slug);
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
