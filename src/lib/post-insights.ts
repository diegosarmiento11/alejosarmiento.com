import { DESCRIPTION_MAX, SLUG_PATTERN, TITLE_MAX } from "./post-format";
import type { PillarSlug } from "./site";

// The live review in the /escribir side panel: the writing guide for the post and
// its AEO, AIO, GEO and SEO checks, computed while the author types. It mirrors
// CLAUDE.md §4. The server review (compose-post, seo-check) still decides whether a
// post can be saved; "fail" here marks what that review will reject, "warn" what
// it lets through but the checklist asks for.

export type PostDraft = {
  title: string;
  slug: string;
  description: string;
  pilar: PillarSlug;
  keywords: string[];
  faq: { question: string; answer: string }[];
  body: string;
};

export type OtherPost = { slug: string; draft: boolean };

export type CheckStatus = "ok" | "warn" | "fail";
export type Check = { id: string; label: string; status: CheckStatus; detail: string };
export type CheckGroup = { id: "aeo" | "aio" | "geo" | "seo"; name: string; about: string; checks: Check[] };
export type Step = { id: string; label: string; hint: string; done: boolean };
export type Insights = { words: number; steps: Step[]; groups: CheckGroup[] };

export const PERSONAL_PILLARS: readonly PillarSlug[] = [
  "diario-de-fundador",
  "30-antes-de-los-30",
  "kilometros",
];

// Text the suggested structure leaves for the author to replace.
export const TEMPLATE_MARK = "✎";

export const WORDS_MIN = 900;
export const WORDS_MAX = 1500;
const PARAGRAPH_WORDS_MAX = 90; // about four lines on a phone

const QUESTION_START =
  /^(c[oó]mo|qu[eé]|por qu[eé]|para qu[eé]|cu[aá]nt[oa]s?|cu[aá]ndo|d[oó]nde|cu[aá]l(es)?|qui[eé]n(es)?|vale la pena|se puede|es posible|sirve)(?!\p{L})/iu;
const FORABI_LINK = /^https:\/\/(www\.)?forabi\.ai/;
const POST_LINK = /^\/blog\/([a-z0-9-]+)/;
// \b is ASCII-only in JavaScript; letter lookarounds keep "aprendí" a whole word.
const FIRST_PERSON =
  /(?<!\p{L})(yo|mi|mis|me|conmigo|nosotros|nuestr[oa]s?|aprend[ií]|hice|tuve|fui|decid[ií])(?!\p{L})/giu;
// A sentence that leans on someone else's data: a percentage, a large figure, a study.
const EXTERNAL_CLAIM =
  /(\d+(?:[.,]\d+)?\s?%|\d+(?:[.,]\d+)?\s?(millones|mil millones|billones)|\bseg[uú]n\b|\bestudio\b|\binforme\b|\bencuesta\b)/i;

function stripCode(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/`[^`]*`/g, "");
}

function plainText(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[#>*_~|-]/g, " ");
}

export function countWords(markdown: string): number {
  return plainText(stripCode(markdown)).split(/\s+/).filter(Boolean).length;
}

function sentences(text: string): number {
  return text.split(/[.!?…]+(?:\s|$)/).filter((part) => part.trim().length > 3).length;
}

type Block = { text: string; kind: "heading" | "paragraph" | "list" | "table" | "other" };

function blocks(body: string): Block[] {
  return stripCode(body)
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((text) => {
      if (/^#{1,6}\s/.test(text)) return { text, kind: "heading" as const };
      if (/^([-*+]|\d+\.)\s/.test(text)) return { text, kind: "list" as const };
      if (/^\|/.test(text)) return { text, kind: "table" as const };
      if (/^[<{>]/.test(text)) return { text, kind: "other" as const };
      return { text, kind: "paragraph" as const };
    });
}

function links(body: string): string[] {
  return [...stripCode(body).matchAll(/\]\(([^)\s]+)/g)].map((match) => match[1]);
}

const check = (id: string, label: string, status: CheckStatus, detail: string): Check => ({
  id,
  label,
  status,
  detail,
});

const pass = (ok: boolean, otherwise: CheckStatus): CheckStatus => (ok ? "ok" : otherwise);

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function analyzePost(post: PostDraft, others: OtherPost[] = []): Insights {
  const personal = PERSONAL_PILLARS.includes(post.pilar);
  const all = blocks(post.body);
  const firstBlock = all[0];
  const firstParagraph = firstBlock?.kind === "paragraph" ? firstBlock.text : "";
  const firstH2 = all.findIndex((block) => /^##\s/.test(block.text));
  const beforeFirstH2 = (firstH2 === -1 ? all : all.slice(0, firstH2)).filter(
    (block) => block.kind === "paragraph",
  );
  const h2s = all.filter((block) => /^##\s/.test(block.text)).map((block) => block.text.slice(3).trim());
  const hasH1 = all.some((block) => /^#\s/.test(block.text));
  const paragraphs = all.filter((block) => block.kind === "paragraph");
  const words = countWords(post.body);
  const hrefs = links(post.body);
  const linkedPosts = hrefs.map((href) => href.match(POST_LINK)?.[1]).filter(Boolean) as string[];
  const linkable = others.filter((other) => other.slug !== post.slug);
  const forabiIndex = post.body.search(/\]\(https:\/\/(www\.)?forabi\.ai/);
  const hasForabi = hrefs.some((href) => FORABI_LINK.test(href));
  const hasPillarLink = hrefs.some((href) => href.startsWith(`/pilares/${post.pilar}`));
  const externalSources = hrefs.filter(
    (href) => /^https?:\/\//.test(href) && !FORABI_LINK.test(href) && !href.includes("alejosarmiento.com"),
  );
  const unsourced = paragraphs.filter(
    (block) => EXTERNAL_CLAIM.test(block.text) && !/\]\(https?:\/\//.test(block.text),
  );
  const longParagraphs = paragraphs.filter((block) => countWords(block.text) > PARAGRAPH_WORDS_MAX);
  const questionH2s = h2s.filter((text) => /[¿?]/.test(text) || QUESTION_START.test(text));
  const emptySections = all.filter(
    (block, index) => /^##\s/.test(block.text) && (!all[index + 1] || all[index + 1].kind === "heading"),
  );
  const mainKeyword = normalize(post.keywords[0] ?? "");
  const keywordAt = mainKeyword ? normalize(post.title).indexOf(mainKeyword) : -1;
  const keywordNearStart = keywordAt !== -1 && keywordAt <= Math.max(25, post.title.length / 2);
  const firstPersonHits = (post.body.match(FIRST_PERSON) ?? []).length;
  const faqFilled = post.faq.filter((item) => item.question.trim() && item.answer.trim());
  const faqOk =
    post.faq.length >= 3 &&
    post.faq.length <= 5 &&
    post.faq.every((item) => item.question.trim().length >= 8 && item.answer.trim().length >= 20);
  const leftovers = post.body.includes(TEMPLATE_MARK);
  const entryNumber = /#\d{1,2} de 30/.test(post.title);

  const opening = personal
    ? beforeFirstH2.length > 0 && firstParagraph.length >= 80
    : firstParagraph.length >= 80 && sentences(firstParagraph) >= 2 && sentences(firstParagraph) <= 3;

  const aeo: Check[] = [
    check(
      "opening",
      personal ? "Escena y la idea antes del primer H2" : "La respuesta va en el primer párrafo",
      firstParagraph.length >= 80 ? pass(opening, "warn") : "fail",
      personal
        ? "Abre con una escena concreta y deja dicha la idea antes del primer subtítulo."
        : `2 o 3 frases que un buscador o un LLM pueda citar sin contexto. Ahora: ${sentences(firstParagraph)} frase(s).`,
    ),
    check(
      "question-h2",
      "Subtítulos redactados como preguntas o búsquedas",
      pass(h2s.length > 0 && questionH2s.length * 2 >= h2s.length, "warn"),
      `${questionH2s.length} de ${h2s.length} H2 suenan a lo que alguien escribe en Google ("¿Cómo…?", "Qué…").`,
    ),
    check(
      "faq",
      "3 a 5 preguntas frecuentes con respuesta directa",
      pass(faqOk, "fail"),
      `Salen como FAQPage en Google. Hay ${faqFilled.length} completas.`,
    ),
    check(
      "description",
      "La descripción responde la búsqueda",
      pass(post.description.length >= 50 && post.description.length <= DESCRIPTION_MAX, "fail"),
      `Entre 50 y ${DESCRIPTION_MAX} caracteres (tiene ${post.description.length}).`,
    ),
  ];

  const aio: Check[] = [
    check(
      "short-paragraphs",
      "Párrafos cortos, citables por separado",
      pass(longParagraphs.length === 0, "warn"),
      longParagraphs.length === 0
        ? `Ninguno pasa de ${PARAGRAPH_WORDS_MAX} palabras.`
        : `${longParagraphs.length} párrafo(s) de más de ${PARAGRAPH_WORDS_MAX} palabras; pártelos.`,
    ),
    check(
      "self-contained",
      "Cada sección se sostiene sola",
      pass(h2s.length > 0 && emptySections.length === 0, "warn"),
      emptySections.length === 0
        ? "Cada H2 abre con texto, así un resumen de IA la puede citar."
        : `${emptySections.length} subtítulo(s) sin texto debajo.`,
    ),
    check(
      "keyword-opening",
      "La palabra clave principal aparece al inicio",
      pass(mainKeyword !== "" && normalize(firstParagraph).includes(mainKeyword), "warn"),
      mainKeyword ? `"${post.keywords[0]}" en el primer párrafo.` : "Define primero las palabras clave.",
    ),
    check(
      "structure",
      "Una lista o tabla que resuma",
      pass(all.some((block) => block.kind === "list" || block.kind === "table"), "warn"),
      "Los pasos, opciones o cifras en lista se extraen mejor en AI Overviews.",
    ),
  ];

  const geo: Check[] = [
    check(
      "sources",
      "Cifras y afirmaciones externas con fuente",
      pass(unsourced.length === 0, "warn"),
      unsourced.length === 0
        ? "Toda cifra externa lleva su enlace."
        : `${unsourced.length} párrafo(s) con cifras o "según" sin enlace a la fuente.`,
    ),
    check(
      "experience",
      "Experiencia propia en primera persona",
      pass(firstPersonHits >= 5, "warn"),
      "Lo que solo tú viviste es lo que un motor generativo no encuentra en otra parte.",
    ),
    check(
      "forabi",
      "Enlace a forabi.ai",
      pass(hasForabi, "fail"),
      personal
        ? "En los posts personales va en el puente final al trabajo."
        : "Según el mapa de enlaces (CLAUDE.md §5).",
    ),
    check(
      "internal",
      "Enlace a otro post",
      linkable.length === 0 ? "ok" : pass(linkedPosts.length > 0, "fail"),
      linkable.length === 0 ? "Aún no hay otros posts." : `Enlaza 1 a 3 posts relacionados (hay ${linkedPosts.length}).`,
    ),
    check(
      "pillar",
      "Enlace a su serie",
      pass(hasPillarLink, "warn"),
      `/pilares/${post.pilar}, para que el post quede dentro de su tema.`,
    ),
    check(
      "external",
      "Al menos una fuente externa",
      pass(externalSources.length > 0, "warn"),
      "Citar fuentes da contexto y confianza a los motores que resumen.",
    ),
  ];

  const seo: Check[] = [
    check(
      "title",
      "Título con la palabra clave cerca del inicio",
      post.title.length < 10 || post.title.length > TITLE_MAX ? "fail" : pass(keywordNearStart, "warn"),
      `Entre 10 y ${TITLE_MAX} caracteres (tiene ${post.title.length}).`,
    ),
    check(
      "slug",
      "Dirección limpia",
      pass(SLUG_PATTERN.test(post.slug), "fail"),
      post.slug ? `/blog/${post.slug}` : "Se arma con el título.",
    ),
    check(
      "keywords",
      "3 a 6 palabras clave",
      pass(post.keywords.length >= 3 && post.keywords.length <= 6, "fail"),
      `Hay ${post.keywords.length}. La primera es la principal.`,
    ),
    check(
      "headings",
      "Sin H1 y con al menos dos H2",
      pass(!hasH1 && h2s.length >= 2, "fail"),
      hasH1 ? "El título ya es el H1; usa H2." : `Hay ${h2s.length} H2.`,
    ),
    check(
      "length",
      `De ${WORDS_MIN.toLocaleString("es-CO")} a ${WORDS_MAX.toLocaleString("es-CO")} palabras`,
      pass(words >= WORDS_MIN && words <= WORDS_MAX, "warn"),
      `Lleva ${words.toLocaleString("es-CO")}.`,
    ),
    ...(post.pilar === "30-antes-de-los-30"
      ? [check("entry", "El título lleva el número de la entrada", pass(entryNumber, "warn"), 'Por ejemplo "#7 de 30".')]
      : []),
  ];

  const steps: Step[] = [
    {
      id: "question",
      label: "Define la pregunta",
      hint: "Título y palabra clave principal: lo que alguien buscaría.",
      done: post.title.length >= 10 && post.title.length <= TITLE_MAX && post.keywords.length > 0,
    },
    {
      id: "opening",
      label: personal ? "Abre con la escena" : "Responde de entrada",
      hint: personal
        ? "Un momento concreto, y la idea dicha antes del primer subtítulo."
        : "El primer párrafo responde el título en 2 o 3 frases.",
      done: opening,
    },
    {
      id: "sections",
      label: "Arma las secciones",
      hint: "Dos o más H2 escritos como preguntas, cada uno con su respuesta.",
      done: h2s.length >= 2 && !hasH1 && emptySections.length === 0,
    },
    {
      id: "develop",
      label: "Desarrolla con ejemplos reales",
      hint: `Una historia y una idea, de ${WORDS_MIN} a ${WORDS_MAX} palabras, párrafos cortos.`,
      done: words >= WORDS_MIN && words <= WORDS_MAX && longParagraphs.length === 0,
    },
    {
      id: "bridge",
      label: personal ? "Cierra con el puente a tu trabajo" : "Lleva a forabi.ai",
      hint: personal
        ? '"Esto mismo lo veo en las clínicas cuando…", con el enlace a forabi.ai.'
        : "El servicio de forabi.ai que corresponde, con texto descriptivo.",
      done: hasForabi && (!personal || forabiIndex >= post.body.length * 0.6),
    },
    {
      id: "links",
      label: "Conecta con el blog",
      hint: "Su serie y 1 a 3 posts relacionados.",
      done: hasPillarLink && (linkable.length === 0 || linkedPosts.length > 0),
    },
    {
      id: "faq",
      label: "Escribe las preguntas frecuentes",
      hint: "3 a 5 preguntas reales con respuesta directa.",
      done: faqOk,
    },
    {
      id: "metadata",
      label: "Descripción y palabras clave",
      hint: `Descripción de hasta ${DESCRIPTION_MAX} caracteres y 3 a 6 palabras clave.`,
      done:
        post.description.length >= 50 &&
        post.description.length <= DESCRIPTION_MAX &&
        post.keywords.length >= 3 &&
        post.keywords.length <= 6,
    },
    {
      id: "clean",
      label: "Quita los textos de la plantilla",
      hint: `No debe quedar ningún "${TEMPLATE_MARK}".`,
      done: !leftovers && words > 0,
    },
  ];

  return {
    words,
    steps,
    groups: [
      { id: "aeo", name: "AEO", about: "Motores de respuesta: fragmentos destacados y voz.", checks: aeo },
      { id: "aio", name: "AIO", about: "AI Overviews: secciones que un resumen puede citar.", checks: aio },
      { id: "geo", name: "GEO", about: "Motores generativos: ChatGPT, Perplexity, Claude.", checks: geo },
      { id: "seo", name: "SEO", about: "Lo básico que exige seo:check.", checks: seo },
    ],
  };
}

// The suggested structure for an empty post, by kind of series.
export function suggestedStructure(pilar: PillarSlug): string {
  const m = TEMPLATE_MARK;
  if (PERSONAL_PILLARS.includes(pilar)) {
    return [
      `${m} La escena: un momento concreto, con lugar y hora. Termina con la idea del post dicha en una frase.`,
      `## ${m} ¿Qué pasó?`,
      `${m} Lo que ocurrió, contado desde lo que ya procesaste.`,
      `## ${m} ¿Qué aprendí?`,
      `${m} La idea, con un ejemplo real.`,
      `## ${m} ¿Qué haría distinto?`,
      `${m} El puente a tu trabajo: "esto mismo lo veo en las clínicas cuando…", con el enlace a forabi.ai.`,
    ].join("\n\n");
  }
  return [
    `${m} La respuesta a la pregunta del título en 2 o 3 frases, citable sin contexto.`,
    `## ${m} ¿Qué es y por qué importa?`,
    `${m} El contexto, con una cifra y su fuente enlazada.`,
    `## ${m} ¿Cómo se hace?`,
    `- ${m} Paso uno\n- ${m} Paso dos`,
    `## ${m} ¿Cuánto cuesta o cuánto tarda?`,
    `${m} Un caso real, y el servicio de forabi.ai que corresponde.`,
  ].join("\n\n");
}
