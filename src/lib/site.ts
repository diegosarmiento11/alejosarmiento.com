// Single source of truth for identity, socials, pillars and link targets.
// Components and posts read from here; nothing hardcodes these values.

export const SITE_URL = "https://alejosarmiento.com";

export const site = {
  name: "Alejandro Sarmiento",
  title: "Alejandro Sarmiento · IA aplicada y software para empresas",
  description:
    "Blog de Alejandro Sarmiento, fundador de forabi.ai: IA aplicada, agentes y software a la medida para empresas en Latinoamérica, explicado sin humo.",
  locale: "es_CO",
  lang: "es",
} as const;

export const author = {
  name: "Alejandro Sarmiento",
  role: "Arquitecto de software · Fundador y CEO de forabi.ai",
  jobTitle: "Fundador y CEO",
  tagline:
    "Construyo software con IA para empresas y escribo lo que aprendo en el camino.",
  shortBio:
    "Arquitecto de software y fundador de forabi.ai. 6 años construyendo software para empresas Fortune 500, el último dedicado por completo a IA aplicada. Organizo Claude Colombia.",
  // Only these facts may be stated about Alejandro across the site.
  facts: [
    "6 años construyendo software para empresas Fortune 500",
    "El último año dedicado por completo a IA aplicada",
    "Fundador y CEO de forabi.ai, consultora de software a la medida e IA con sede en Bogotá",
    "Organizador de Claude Colombia, comunidad educativa de IA en español",
    "Comunidad de 52K personas en @alejosarmiento.ai",
  ],
  knowsAbout: [
    "Inteligencia artificial aplicada",
    "Arquitectura de software",
    "Automatización de procesos con IA",
    "Agentes de IA",
  ],
  location: "Bogotá, Colombia",
  photo: "/brand/alejandro.jpg",
  photoAlt: "Alejandro Sarmiento, fundador y CEO de forabi.ai",
  email: "alejandro@forabi.ai",
} as const;

export const socials = {
  instagram: {
    label: "Instagram",
    handle: "@alejosarmiento.ai",
    url: "https://www.instagram.com/alejosarmiento.ai/",
  },
  linkedin: {
    label: "LinkedIn",
    handle: "Alejandro Sarmiento",
    url: "https://www.linkedin.com/company/forabi-ai",
  },
  forabi: {
    label: "forabi.ai",
    handle: "forabi.ai",
    url: "https://forabi.ai",
  },
} as const;

export const CLAUDE_COLOMBIA_URL = "https://instagram.com/claude.colomb.ia";

export const pillars = {
  "ia-aplicada": {
    name: "IA aplicada",
    description:
      "Cómo usar inteligencia artificial en la operación real de una empresa: qué automatizar, cuánto cuesta y qué resultados esperar.",
  },
  "agentes-de-ia": {
    name: "Agentes de IA",
    description:
      "Qué es un agente de IA, cómo se diseña y cómo se pone a trabajar en ventas, soporte y operación sin perder el control.",
  },
  "construir-software": {
    name: "Construir software",
    description:
      "Arquitectura, herramientas y decisiones para construir software con IA: Claude Code, desarrollo a la medida y lo que aprendo haciéndolo.",
  },
} as const;

export type PillarSlug = keyof typeof pillars;
export const pillarSlugs = Object.keys(pillars) as [PillarSlug, ...PillarSlug[]];

// Where posts link on forabi.ai, by topic. Mirrors the table in CLAUDE.md §5.
export const linkMap = {
  operations: "https://forabi.ai/servicios/ia-en-operaciones",
  customSoftware: "https://forabi.ai/servicios/software-a-la-medida",
  integrations: "https://forabi.ai/servicios/integraciones",
  health: "https://forabi.ai/health",
  cases: "https://forabi.ai/casos",
  about: "https://forabi.ai/sobre",
} as const;

export const PERSON_ID = `${SITE_URL}/#alejandro-sarmiento`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const FORABI_ORG_ID = "https://forabi.ai/#organization";

export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

export function postPath(slug: string): string {
  return `/blog/${slug}`;
}
