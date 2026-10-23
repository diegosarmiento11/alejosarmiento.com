import { describe, expect, it } from "vitest";
import {
  cleanPostInput,
  composeMdx,
  mdxToPostInput,
  reviewPost,
  todayInBogota,
  toPostInput,
} from "./compose-post";
import { parsePost, type Post } from "./posts";

const body = [
  "Primer párrafo que responde la pregunta del título con suficiente detalle para que se entienda solo.",
  "## Uno",
  "Ver [forabi](https://forabi.ai/servicios/ia-en-operaciones) y [otro post](/blog/existente).",
  "## Dos",
  "Fin.",
].join("\n\n");

const valid = {
  title: "Qué aprendí corriendo mi primera maratón",
  description:
    "Lo que una maratón me enseñó sobre fundar una empresa: ritmo, paciencia y saber cuándo parar a tiempo.",
  pilar: "kilometros",
  keywords: ["maratón", "fundar empresa", "disciplina"],
  faq: [
    { question: "¿Cuánto entrenaste?", answer: "Dieciséis semanas, cuatro días por semana." },
    { question: "¿Volverías a correr?", answer: "Sí, pero con un plan más conservador." },
    { question: "¿Qué tiene que ver con forabi?", answer: "El ritmo sostenible vale para los dos." },
  ],
  body,
};

const existing: Post = parsePost(
  "existente",
  composeMdx(cleanPostInput({ ...valid, title: "Un post que ya existe en el blog" }), {
    datePublished: "2026-10-01",
    dateModified: "2026-10-01",
  }),
);

describe("todayInBogota", () => {
  it("uses Colombia's date, not UTC", () => {
    expect(todayInBogota(new Date("2026-10-22T03:00:00Z"))).toBe("2026-10-21");
  });
});

describe("cleanPostInput", () => {
  it("derives the slug, trims fields and drops empty entries", () => {
    const input = cleanPostInput({
      ...valid,
      title: "  Qué aprendí corriendo  ",
      keywords: [" uno ", "", "dos"],
      faq: [{ question: "", answer: "" }, ...valid.faq],
      body: "Hola\r\nmundo",
      pilar: "no-existe",
    });
    expect(input.slug).toBe("aprendi-corriendo");
    expect(input.title).toBe("Qué aprendí corriendo");
    expect(input.keywords).toEqual(["uno", "dos"]);
    expect(input.faq).toHaveLength(3);
    expect(input.body).toBe("Hola\nmundo");
    expect(input.pilar).toBe("diario-de-fundador");
    expect(input.draft).toBe(false);
  });

  it("keeps the edited post's slug when none is sent, even if the title changed", () => {
    const input = cleanPostInput({ ...valid, title: "Otro título" }, { editing: "existente" });
    expect(input.slug).toBe("existente");
  });
});

describe("reviewPost", () => {
  const today = "2026-10-21";

  it("produces a file the blog can parse, dated today", () => {
    const review = reviewPost(cleanPostInput(valid), [existing], { today });
    expect(review.issues).toEqual([]);
    const post = parsePost("aprendi-corriendo-primera-maraton", review.mdx);
    expect(post.datePublished).toBe(today);
    expect(post.dateModified).toBe(today);
    expect(post.content.trim()).toBe(body);
    expect(post.faq).toEqual(valid.faq);
  });

  it("explains length and count problems in plain words", () => {
    const review = reviewPost(
      cleanPostInput({ ...valid, title: "Corto", keywords: ["uno"], faq: [] }),
      [existing],
      { today },
    );
    expect(review.issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining("El título debe tener"),
        expect.stringContaining("entre 3 y 6 palabras clave"),
        expect.stringContaining("entre 3 y 5 preguntas"),
      ]),
    );
  });

  it("refuses a slug or title that already exists", () => {
    const review = reviewPost(
      cleanPostInput({ ...valid, slug: "existente", title: existing.title }),
      [existing],
      { today },
    );
    expect(review.issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining("slug"),
        expect.stringContaining("mismo título"),
      ]),
    );
  });

  it("applies the content rules of seo:check", () => {
    const review = reviewPost(
      cleanPostInput({ ...valid, body: "Muy corto.\n\n## Solo uno" }),
      [existing],
      { today },
    );
    expect(review.issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining("dos H2"),
        expect.stringContaining("forabi.ai"),
        expect.stringContaining("enlace interno"),
      ]),
    );
  });

  it("keeps the slug, publication date and video when editing", () => {
    const withVideo = parsePost(
      "existente",
      composeMdx(
        cleanPostInput({ ...valid, title: "Un post que ya existe en el blog" }),
        { datePublished: "2026-10-01", dateModified: "2026-10-01" },
        { url: "https://www.instagram.com/reel/abc/", uploadDate: "2026-10-01" },
      ),
    );
    const input = { ...toPostInput(withVideo), description: `${valid.description.slice(0, 90)} Editada.` };
    const review = reviewPost(input, [withVideo], { today, editing: withVideo });

    expect(review.issues).toEqual([]);
    const edited = parsePost("existente", review.mdx);
    expect(edited.datePublished).toBe("2026-10-01");
    expect(edited.dateModified).toBe(today);
    expect(edited.video?.url).toBe("https://www.instagram.com/reel/abc/");
    expect(edited.description).toMatch(/Editada\.$/);
  });

  it("does not let an edit move the post to another address", () => {
    const review = reviewPost({ ...toPostInput(existing), slug: "otra-direccion" }, [existing], {
      today,
      editing: existing,
    });
    expect(review.issues).toContain("La dirección de un post publicado no se cambia.");
  });
});

describe("mdxToPostInput", () => {
  it("reads back a downloaded post, slug from the file name", () => {
    const source = composeMdx(cleanPostInput({ ...valid, slug: "maraton" }), {
      datePublished: "2026-10-01",
      dateModified: "2026-10-02",
    });
    const input = mdxToPostInput(source, "maraton.mdx");
    expect(input).toEqual(cleanPostInput({ ...valid, slug: "maraton" }));
  });

  it("loads an incomplete file and derives the slug when the name is not one", () => {
    const input = mdxToPostInput("---\ntitle: Un título suelto\n---\n\nSolo texto.", "Mi Post (1).mdx");
    expect(input.slug).toBe("titulo-suelto");
    expect(input.body).toBe("Solo texto.");
    expect(input.faq).toEqual([]);
  });
});
