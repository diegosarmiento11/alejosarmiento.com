import type { Post } from "./posts";

export type SeoIssue = { slug: string; message: string };

const FORABI_LINK = /\]\(https:\/\/(?:www\.)?forabi\.ai[^)]*\)/;
const INTERNAL_POST_LINK = /\]\(\/blog\/([a-z0-9-]+)[^)]*\)/g;

function stripCode(markdown: string): string {
  return markdown.replace(/```[\s\S]*?```/g, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
}

// Content rules from CLAUDE.md §4 that the frontmatter schema cannot express.
export function checkPost(post: Post, all: Post[]): SeoIssue[] {
  const issues: string[] = [];
  const body = stripCode(post.content);

  if (/^#\s/m.test(body)) {
    issues.push("el cuerpo tiene un H1; el título ya lo es, usa H2 en adelante");
  }
  if ((body.match(/^##\s/gm) ?? []).length < 2) {
    issues.push("necesita al menos dos H2");
  }
  if (!FORABI_LINK.test(body)) {
    issues.push("falta un enlace a forabi.ai (mapa de enlaces, CLAUDE.md §5)");
  }
  if (post.dateModified < post.datePublished) {
    issues.push("dateModified es anterior a datePublished");
  }

  const slugs = new Set(all.map((other) => other.slug));
  const linked = [...body.matchAll(INTERNAL_POST_LINK)].map((match) => match[1]);
  for (const slug of linked) {
    if (!slugs.has(slug)) issues.push(`enlaza a /blog/${slug}, que no existe`);
  }
  // A published post must not send readers to a draft, which 404s in production.
  if (!post.draft) {
    for (const slug of linked) {
      if (all.find((other) => other.slug === slug)?.draft) {
        issues.push(`enlaza a /blog/${slug}, que todavía es borrador`);
      }
    }
  }
  const linkable = all.filter((other) => other.slug !== post.slug && (post.draft || !other.draft));
  if (linkable.length > 0 && linked.length === 0) {
    issues.push("falta al menos un enlace interno a otro post");
  }

  const firstParagraph = body.trim().split(/\n\s*\n/)[0] ?? "";
  if (firstParagraph.startsWith("#") || firstParagraph.length < 80) {
    issues.push("el primer párrafo debe responder la pregunta del título (2 o 3 frases)");
  }

  return issues.map((message) => ({ slug: post.slug, message }));
}

export function checkAll(posts: Post[]): SeoIssue[] {
  const issues = posts.flatMap((post) => checkPost(post, posts));
  const titles = new Map<string, string>();
  for (const post of posts) {
    const previous = titles.get(post.title.toLowerCase());
    if (previous) {
      issues.push({ slug: post.slug, message: `mismo title que "${previous}"` });
    }
    titles.set(post.title.toLowerCase(), post.slug);
  }
  return issues;
}
