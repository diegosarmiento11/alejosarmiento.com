import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  DESCRIPTION_MAX,
  findPost,
  POSTS_KEY,
  parsePost,
  postHistoryKey,
  readingMinutes,
  readPosts,
  savePost,
  TITLE_MAX,
} from "./posts";
import { MemoryStore } from "./store";
import { checkAll, checkPost } from "./seo-check";

function mdx(overrides: Record<string, string> = {}, body?: string): string {
  const fields: Record<string, string> = {
    title: '"Qué automatizar primero con IA en tu empresa"',
    description:
      '"Empieza por el proceso repetitivo, con reglas claras y volumen alto. Un método simple para elegir."',
    datePublished: "2026-10-09",
    dateModified: "2026-10-09",
    pilar: "construir-con-ia",
    keywords: "[uno, dos, tres]",
    faq: `
  - question: "¿Primera pregunta de ejemplo?"
    answer: "Una respuesta suficientemente larga para pasar."
  - question: "¿Segunda pregunta de ejemplo?"
    answer: "Una respuesta suficientemente larga para pasar."
  - question: "¿Tercera pregunta de ejemplo?"
    answer: "Una respuesta suficientemente larga para pasar."`,
    ...overrides,
  };
  const frontmatter = Object.entries(fields)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
  return `---\n${frontmatter}\n---\n\n${
    body ??
    "Primer párrafo que responde la pregunta del título con suficiente detalle para que se entienda solo.\n\n## Uno\n\nVer [forabi](https://forabi.ai/servicios/ia-en-operaciones).\n\n## Dos\n\nFin."
  }`;
}

describe("parsePost", () => {
  it("parses a valid post and normalizes dates", () => {
    const post = parsePost("mi-post", mdx());
    expect(post.slug).toBe("mi-post");
    expect(post.datePublished).toBe("2026-10-09");
    expect(post.draft).toBe(false);
    expect(post.faq).toHaveLength(3);
  });

  it("rejects a title over the limit, naming the field", () => {
    const long = `"${"x".repeat(TITLE_MAX + 1)}"`;
    expect(() => parsePost("mi-post", mdx({ title: long }))).toThrow(/title/);
  });

  it("rejects a description over the limit", () => {
    const long = `"${"x".repeat(DESCRIPTION_MAX + 1)}"`;
    expect(() => parsePost("mi-post", mdx({ description: long }))).toThrow(/description/);
  });

  it("rejects an unknown pillar and too few FAQ entries", () => {
    expect(() => parsePost("mi-post", mdx({ pilar: "recetas" }))).toThrow(/pilar/);
    expect(() =>
      parsePost(
        "mi-post",
        mdx({ faq: '\n  - question: "¿Solo una pregunta?"\n    answer: "Una respuesta suficientemente larga."' }),
      ),
    ).toThrow(/faq/);
  });

  it("rejects slugs with uppercase, accents or underscores", () => {
    for (const slug of ["Mi-Post", "automatización", "mi_post", "-mi-post"]) {
      expect(() => parsePost(slug, mdx())).toThrow(/Slug inválido/);
    }
  });
});

describe("readingMinutes", () => {
  it("never reports less than a minute", () => {
    expect(readingMinutes("hola")).toBe(1);
    expect(readingMinutes("palabra ".repeat(660))).toBe(3);
  });
});

describe("seo check", () => {
  const good = parsePost("uno", mdx());

  it("passes a post that follows the checklist", () => {
    expect(checkPost(good, [good])).toEqual([]);
  });

  it("flags a missing forabi link, an H1 and too few H2", () => {
    const post = parsePost(
      "dos",
      mdx({}, "Primer párrafo que responde la pregunta del título con suficiente detalle para pasar.\n\n# Título\n\n## Único"),
    );
    const messages = checkPost(post, [post]).map((issue) => issue.message).join("|");
    expect(messages).toMatch(/H1/);
    expect(messages).toMatch(/dos H2/);
    expect(messages).toMatch(/forabi\.ai/);
  });

  it("requires an internal link once another post exists, and rejects broken ones", () => {
    const other = parsePost("otro", mdx({ title: '"Otro título distinto para el segundo"' }));
    expect(checkPost(good, [good, other]).map((issue) => issue.message)).toEqual([
      "falta al menos un enlace interno a otro post",
    ]);

    const broken = parsePost(
      "tres",
      mdx({}, "Primer párrafo que responde la pregunta del título con suficiente detalle para pasar.\n\n## Uno\n\n[forabi](https://forabi.ai/casos) y [roto](/blog/no-existe).\n\n## Dos\n\nFin."),
    );
    expect(checkPost(broken, [broken, other]).map((issue) => issue.message)).toContain(
      "enlaza a /blog/no-existe, que no existe",
    );
  });

  it("does not let a published post link to a draft", () => {
    const draft = parsePost("borrador", mdx({ draft: "true", title: '"Un borrador que aún no sale"' }));
    const published = parsePost(
      "publicado",
      mdx({}, "Primer párrafo que responde la pregunta del título con suficiente detalle para pasar.\n\n## Uno\n\n[forabi](https://forabi.ai/casos) y [borrador](/blog/borrador).\n\n## Dos\n\nFin."),
    );
    expect(checkPost(published, [published, draft]).map((issue) => issue.message)).toEqual([
      "enlaza a /blog/borrador, que todavía es borrador",
    ]);
  });

  it("flags duplicate titles", () => {
    const twin = parsePost("gemelo", mdx());
    expect(checkAll([good, twin]).map((issue) => issue.message)).toContain(
      'mismo title que "uno"',
    );
  });
});

describe("posts in the store", () => {
  const now = new Date("2026-10-21T12:00:00Z");

  it("reads them sorted by date, hiding drafts unless asked", async () => {
    const store = new MemoryStore();
    await savePost(store, "viejo", mdx({ datePublished: "2026-01-01", dateModified: "2026-01-01" }), now);
    await savePost(store, "nuevo", mdx({ title: '"Un título distinto y más nuevo"' }), now);
    await savePost(store, "borrador", mdx({ title: '"Un borrador que aún no sale"', draft: "true" }), now);

    expect((await readPosts(store)).posts.map((post) => post.slug)).toEqual(["nuevo", "viejo"]);
    const all = await readPosts(store, { includeDrafts: true });
    expect(all.posts.map((post) => post.slug)).toContain("borrador");
  });

  it("reports an invalid stored post instead of failing the whole list", async () => {
    const store = new MemoryStore();
    await savePost(store, "bueno", mdx(), now);
    await store.hset(POSTS_KEY, "roto", "---\ntitle: x\n---\n");
    const { posts, errors } = await readPosts(store);
    expect(posts.map((post) => post.slug)).toEqual(["bueno"]);
    expect(errors[0]).toMatch(/roto/);
  });

  it("refuses to save an invalid post", async () => {
    await expect(savePost(new MemoryStore(), "roto", "---\ntitle: x\n---\n", now)).rejects.toThrow();
  });

  it("keeps the replaced version in the post's history", async () => {
    const store = new MemoryStore();
    const first = mdx();
    await savePost(store, "uno", first, now);
    await savePost(store, "uno", mdx({ dateModified: "2026-10-10" }), now);
    expect(await store.hgetall(postHistoryKey("uno"))).toEqual({ [now.toISOString()]: first });
  });

  it("finds one post directly and ignores bad slugs", async () => {
    const store = new MemoryStore();
    await savePost(store, "uno", mdx(), now);
    expect((await findPost(store, "uno"))?.slug).toBe("uno");
    expect(await findPost(store, "otro")).toBeUndefined();
    expect(await findPost(store, "../uno")).toBeUndefined();
  });
});

describe("the example post development runs on", () => {
  it("parses and passes the SEO check", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "content", "ejemplo.mdx"), "utf8");
    const post = parsePost("post-de-ejemplo", source);
    expect(checkAll([post])).toEqual([]);
  });
});
