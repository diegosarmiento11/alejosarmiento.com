import matter from "gray-matter";
import { DESCRIPTION_MAX, SLUG_PATTERN, slugify, TITLE_MAX } from "./post-format";
import { frontmatterSchema, parsePost, type Post } from "./posts";
import { checkPost } from "./seo-check";
import { pillarSlugs, type PillarSlug } from "./site";

// Turns what the author types in /escribir into the MDX source stored for a post,
// and reviews it with the same rules seo:check enforces.

export type PostInput = {
  title: string;
  slug: string;
  description: string;
  pilar: PillarSlug;
  keywords: string[];
  faq: { question: string; answer: string }[];
  body: string;
  draft: boolean;
};

// Today in Colombia, as the author sees it when publishing at night.
export function todayInBogota(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

// `editing` is the slug of the stored post being edited: a blank slug keeps it,
// instead of deriving a new one from a changed title.
export function cleanPostInput(raw: unknown, { editing }: { editing?: string } = {}): PostInput {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const title = text(data.title);
  const pilar = pillarSlugs.find((slug) => slug === data.pilar) ?? pillarSlugs[0];
  return {
    title,
    slug: text(data.slug) || editing || slugify(title),
    description: text(data.description),
    pilar,
    keywords: (Array.isArray(data.keywords) ? data.keywords : [])
      .map(text)
      .filter(Boolean),
    faq: (Array.isArray(data.faq) ? data.faq : [])
      .map((item) => {
        const entry = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
        return { question: text(entry.question), answer: text(entry.answer) };
      })
      .filter((item) => item.question || item.answer),
    // Line endings from phones and Windows become plain newlines.
    body: typeof data.body === "string" ? data.body.replace(/\r\n?/g, "\n").trim() : "",
    draft: data.draft === true,
  };
}

type Dates = { datePublished: string; dateModified: string };

// `video` has no field in the form; an edit carries over the one the post had.
export function composeMdx(
  input: PostInput,
  { datePublished, dateModified }: Dates,
  video?: Post["video"],
): string {
  return matter.stringify(`\n${input.body}\n`, {
    title: input.title,
    description: input.description,
    datePublished,
    dateModified,
    pilar: input.pilar,
    keywords: input.keywords,
    faq: input.faq,
    ...(video ? { video } : {}),
    draft: input.draft,
  });
}

// The form's view of a stored post, for editing it.
export function toPostInput(post: Post): PostInput {
  return {
    title: post.title,
    slug: post.slug,
    description: post.description,
    pilar: post.pilar,
    keywords: post.keywords,
    faq: post.faq,
    body: post.content.trim(),
    draft: post.draft,
  };
}

// An uploaded .mdx file, read into the form. It is lenient on purpose: a file
// missing fields still loads, and the review names what to fix before publishing.
// Dates are not read: they come from the stored post or from today.
export const IMPORT_MAX_CHARS = 200_000;

export function mdxToPostInput(source: string, fileName: string): PostInput {
  const { data, content } = matter(source);
  const fileSlug = fileName.replace(/\.mdx?$/i, "");
  return cleanPostInput({
    ...data,
    slug: SLUG_PATTERN.test(fileSlug) ? fileSlug : "",
    body: content,
  });
}

const FIELD_LABELS: Record<string, string> = {
  title: "Título",
  description: "Descripción",
  pilar: "Serie",
  keywords: "Palabras clave",
  faq: "Preguntas frecuentes",
};

// Readable messages for the rules the author is most likely to trip on.
function inputIssues(input: PostInput): string[] {
  const issues: string[] = [];
  if (!SLUG_PATTERN.test(input.slug)) {
    issues.push("El slug solo admite minúsculas sin tildes, números y guiones.");
  }
  if (input.title.length < 10 || input.title.length > TITLE_MAX) {
    issues.push(`El título debe tener entre 10 y ${TITLE_MAX} caracteres (tiene ${input.title.length}).`);
  }
  if (input.description.length < 50 || input.description.length > DESCRIPTION_MAX) {
    issues.push(
      `La descripción debe tener entre 50 y ${DESCRIPTION_MAX} caracteres (tiene ${input.description.length}).`,
    );
  }
  if (input.keywords.length < 3 || input.keywords.length > 6) {
    issues.push(`Pon entre 3 y 6 palabras clave (hay ${input.keywords.length}).`);
  }
  if (input.faq.length < 3 || input.faq.length > 5) {
    issues.push(`Pon entre 3 y 5 preguntas frecuentes (hay ${input.faq.length}).`);
  }
  input.faq.forEach((item, index) => {
    if (item.question.length < 8) issues.push(`La pregunta ${index + 1} es muy corta.`);
    if (item.answer.length < 20) issues.push(`La respuesta ${index + 1} es muy corta.`);
  });
  return issues;
}

export type Review = { mdx: string; issues: string[] };

// `editing` is the stored version when the author edits a post: it keeps its slug,
// its publication date and its video, and only dateModified moves to today.
export function reviewPost(
  input: PostInput,
  all: Post[],
  { today, editing }: { today: string; editing?: Post },
): Review {
  const existing = editing ? all.filter((post) => post.slug !== editing.slug) : all;
  const mdx = composeMdx(
    input,
    { datePublished: editing?.datePublished ?? today, dateModified: today },
    editing?.video,
  );
  const issues = inputIssues(input);

  if (editing && input.slug !== editing.slug) {
    issues.push("La dirección de un post publicado no se cambia.");
  }
  if (existing.some((post) => post.slug === input.slug)) {
    issues.push(`Ya existe un post con el slug "${input.slug}".`);
  }
  if (existing.some((post) => post.title.toLowerCase() === input.title.toLowerCase())) {
    issues.push("Ya existe un post con ese mismo título.");
  }
  if (issues.length > 0) return { mdx, issues };

  // Anything the friendly checks above missed still surfaces, with the field named.
  const parsed = frontmatterSchema.safeParse(matter(mdx).data);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((issue) => {
      const field = String(issue.path[0] ?? "");
      return `${FIELD_LABELS[field] ?? field}: ${issue.message}`;
    });
    return { mdx, issues: messages };
  }

  const post = parsePost(input.slug, mdx);
  const contentIssues = checkPost(post, [...existing, post]).map(
    (issue) => issue.message.charAt(0).toUpperCase() + issue.message.slice(1) + ".",
  );
  return { mdx, issues: contentIssues };
}
