import type { Post } from "./posts";
import {
  absoluteUrl,
  author,
  CLAUDE_COLOMBIA_URL,
  FORABI_ORG_ID,
  PERSON_ID,
  pillars,
  postPath,
  site,
  SITE_URL,
  socials,
  WEBSITE_ID,
} from "./site";

// The same Person @id is referenced from every page so search engines and LLMs
// resolve all posts to one entity.
export function personSchema() {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: author.name,
    url: absoluteUrl("/sobre-mi"),
    image: absoluteUrl(author.photo),
    jobTitle: author.jobTitle,
    description: author.shortBio,
    email: `mailto:${author.email}`,
    knowsAbout: [...author.knowsAbout],
    homeLocation: { "@type": "Place", name: author.location },
    worksFor: {
      "@type": "Organization",
      "@id": FORABI_ORG_ID,
      name: "forabi.ai",
      url: socials.forabi.url,
    },
    sameAs: [
      socials.instagram.url,
      socials.linkedin.url,
      socials.forabi.url,
      CLAUDE_COLOMBIA_URL,
    ],
  };
}

export function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: site.name,
    description: site.description,
    inLanguage: "es",
    publisher: { "@id": PERSON_ID },
  };
}

export function siteGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [personSchema(), websiteSchema()],
  };
}

export function profilePageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: absoluteUrl("/sobre-mi"),
    inLanguage: "es",
    mainEntity: { "@id": PERSON_ID },
  };
}

function isoDuration(seconds: number): string {
  return `PT${Math.floor(seconds / 60)}M${seconds % 60}S`;
}

export function postGraph(post: Post) {
  const url = absoluteUrl(postPath(post.slug));
  const pillar = pillars[post.pilar];
  const graph: object[] = [
    {
      "@type": "BlogPosting",
      "@id": `${url}#article`,
      mainEntityOfPage: url,
      url,
      headline: post.title,
      description: post.description,
      image: absoluteUrl(`${postPath(post.slug)}/opengraph-image`),
      datePublished: post.datePublished,
      dateModified: post.dateModified,
      inLanguage: "es",
      keywords: post.keywords.join(", "),
      articleSection: pillar.name,
      author: { "@id": PERSON_ID },
      publisher: { "@id": PERSON_ID },
      isPartOf: { "@id": WEBSITE_ID },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Blog", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: pillar.name,
          item: absoluteUrl(`/pilares/${post.pilar}`),
        },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: post.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ];
  if (post.video) {
    graph.push({
      "@type": "VideoObject",
      name: post.video.name ?? post.title,
      description: post.description,
      thumbnailUrl: absoluteUrl(`${postPath(post.slug)}/opengraph-image`),
      uploadDate: post.video.uploadDate,
      embedUrl: post.video.url,
      ...(post.video.durationSeconds
        ? { duration: isoDuration(post.video.durationSeconds) }
        : {}),
    });
  }
  // The Person node itself is emitted once, by the root layout.
  return { "@context": "https://schema.org", "@graph": graph };
}

// Escapes "<" so content can never close the script tag.
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
