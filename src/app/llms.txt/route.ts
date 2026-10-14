import { getAllPosts } from "@/lib/posts";
import { absoluteUrl, author, pillars, postPath, site, socials } from "@/lib/site";

// https://llmstxt.org: a plain-text map of the site for language models.
export function GET() {
  const posts = getAllPosts().filter((post) => !post.draft);
  const sections = Object.entries(pillars)
    .map(([slug, pillar]) => {
      const list = posts
        .filter((post) => post.pilar === slug)
        .map((post) => `- [${post.title}](${absoluteUrl(postPath(post.slug))}): ${post.description}`)
        .join("\n");
      return list ? `## ${pillar.name}\n\n${list}` : "";
    })
    .filter(Boolean)
    .join("\n\n");

  const text = `# ${site.name}

> ${site.description}

${author.name}: ${author.facts.join(". ")}.

${author.disambiguation}

- [Sobre Alejandro Sarmiento](${absoluteUrl("/sobre-mi")})
- [forabi.ai](${socials.forabi.url})
- [Instagram](${socials.instagram.url})
- [LinkedIn](${socials.linkedin.url})
- Contacto: ${author.email}

${sections}
`;
  return new Response(text, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
