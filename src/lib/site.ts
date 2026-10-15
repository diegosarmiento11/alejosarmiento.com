// Single source of truth for identity, socials, pillars and link targets.
// Components and posts read from here; nothing hardcodes these values.

export const SITE_URL = "https://alejosarmiento.com";

export const site = {
  name: "Alejandro Sarmiento",
  title: "Alejandro Sarmiento · Fundador de forabi.ai · IA aplicada",
  description:
    "Blog de Alejandro Sarmiento, fundador de forabi.ai y organizador de Claude Colombia: lo que vivo al fundar una empresa, entrenar y aplicar IA.",
  locale: "es_CO",
  lang: "es",
} as const;

export const author = {
  name: "Alejandro Sarmiento",
  // Legal name. Only used to tell him apart from namesakes, never as a byline.
  fullName: "Diego Alejandro Sarmiento",
  // The fixed line that travels with the name on every profile.
  identityLine: "fundador de forabi.ai y organizador de Claude Colombia",
  role: "Arquitecto de software · Fundador y CEO de forabi.ai",
  jobTitle: "Fundador y CEO",
  tagline:
    "Construyo software con IA para empresas y escribo lo que aprendo en el camino.",
  shortBio:
    "Fundador y CEO de forabi.ai, consultora de software a la medida e IA en Bogotá. Organizo Claude Colombia. Antes, 4 años en Hatchworks AI construyendo para Cox Communications y FanDuel.",
  // Only these facts may be stated about Alejandro across the site.
  facts: [
    "4 años en Hatchworks AI construyendo para Cox Communications y FanDuel",
    "Fundador y CEO de forabi.ai, consultora de software a la medida e IA con sede en Bogotá",
    "Organizador de Claude Colombia, comunidad educativa de IA en español",
    "Comunidad de 52K personas en @alejosarmiento.ai",
    "Los primeros tres clientes de forabi.ai salieron de amigos del triatlón",
    "Reto «30 antes de los 30», con fecha límite el 11 de julio de 2027",
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
    url: "https://www.linkedin.com/in/diegoalejandrosarmiento/",
  },
  forabi: {
    label: "forabi.ai",
    handle: "forabi.ai",
    url: "https://forabi.ai",
  },
} as const;

export const CLAUDE_COLOMBIA_URL = "https://instagram.com/claude.colomb.ia";

// Personal series first, then the business ones. The order is the one readers see.
export const pillars = {
  "diario-de-fundador": {
    name: "Diario de fundador",
    description:
      "Lo que no se ve de montar forabi.ai: las decisiones, el dinero, la soledad y las relaciones que cambian cuando fundas una empresa.",
  },
  "30-antes-de-los-30": {
    name: "30 antes de los 30",
    description:
      "Un reto con fecha límite: 30 cosas antes de cumplir 30, el 11 de julio de 2027. Cada entrada cuenta una, numerada de 1 a 30.",
  },
  kilometros: {
    name: "Kilómetros",
    description:
      "Lo que el entrenamiento me enseña sobre construir una empresa, kilómetro a kilómetro.",
  },
  "ia-aplicada": {
    name: "IA aplicada",
    description:
      "Cómo usar inteligencia artificial y agentes en la operación real de una empresa: qué automatizar, cuánto cuesta y qué resultados esperar.",
  },
  "construir-con-ia": {
    name: "Construir con IA",
    description:
      "Cómo construyo software con Claude y otras herramientas de IA, explicado en español: arquitectura, decisiones y lo que aprendo haciéndolo.",
  },
} as const;

// Pillars that were retired, and where their pages now point.
export const retiredPillars = {
  "agentes-de-ia": "ia-aplicada",
  "construir-software": "construir-con-ia",
} as const satisfies Record<string, PillarSlug>;

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

// forabi.ai emits its founder with this same @id; keep the two in sync.
export const PERSON_ID = `${SITE_URL}/#person`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const FORABI_ORG_ID = "https://forabi.ai/#organization";

export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

export function postPath(slug: string): string {
  return `/blog/${slug}`;
}
