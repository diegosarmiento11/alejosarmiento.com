import matter from "gray-matter";
import { DESCRIPTION_MAX, SLUG_PATTERN, slugify, TITLE_MAX } from "./post-format";
import { frontmatterSchema, parsePost, type Post } from "./posts";
import { checkPost } from "./seo-check";
import { pillarSlugs, type PillarSlug } from "./site";

// Turns what the author types in /escribir into a content/blog/<slug>.mdx file,
// and reviews it with the same rules the build and seo:check enforce.

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

export function cleanPostInput(raw: unknown): PostInput {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const title = text(data.title);
  const pilar = pillarSlugs.find((slug) => slug === data.pilar) ?? pillarSlugs[0];
  return {
    title,
    slug: text(data.slug) || slugify(title),
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

export function composeMdx(input: PostInput, today: string): string {
  return matter.stringify(`\n${input.body}\n`, {
    title: input.title,
    description: input.description,
    datePublished: today,
    dateModified: today,
    pilar: input.pilar,
    keywords: input.keywords,
    faq: input.faq,
    draft: input.draft,
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

export function reviewPost(input: PostInput, existing: Post[], today: string): Review {
  const mdx = composeMdx(input, today);
  const issues = inputIssues(input);

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
