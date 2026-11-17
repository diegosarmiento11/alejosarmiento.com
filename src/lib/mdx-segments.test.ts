import { describe, expect, it } from "vitest";
import { escapeMdxText, joinMdx, splitMdx } from "./mdx-segments";

const body = `Primer párrafo con la respuesta.

{/* <Video url="https://www.instagram.com/reel/X/" /> */}

## Un H2

Texto con [enlace](https://forabi.ai).

<Callout>
Una idea para recordar.
</Callout>

<Video url="https://youtu.be/abc" title="El video" />

\`\`\`tsx
<Callout>dentro de código</Callout>
\`\`\`

<Otro prop="x" />`;

describe("splitMdx", () => {
  it("separates Markdown from the MDX elements the editor models", () => {
    expect(splitMdx(body).map((segment) => segment.kind)).toEqual([
      "markdown",
      "raw",
      "markdown",
      "callout",
      "video",
      "markdown",
      "raw",
    ]);
  });

  it("reads the callout text and the video attributes", () => {
    const segments = splitMdx(body);
    expect(segments[3]).toEqual({ kind: "callout", text: "Una idea para recordar." });
    expect(segments[4]).toEqual({ kind: "video", url: "https://youtu.be/abc", title: "El video" });
  });

  it("leaves components inside code fences as Markdown", () => {
    const code = splitMdx(body)[5];
    expect(code.kind === "markdown" && code.text).toContain("<Callout>dentro de código</Callout>");
  });

  it("keeps an unclosed callout verbatim instead of dropping text", () => {
    expect(splitMdx("<Callout>\nsin cierre")).toEqual([
      { kind: "raw", source: "<Callout>\nsin cierre" },
    ]);
  });
});

describe("joinMdx", () => {
  it("round-trips a body through split and join", () => {
    expect(joinMdx(splitMdx(body))).toBe(body);
  });

  it("escapes quotes in video attributes", () => {
    expect(joinMdx([{ kind: "video", url: "https://youtu.be/a", title: 'Un "título"' }])).toBe(
      '<Video url="https://youtu.be/a" title="Un &quot;título&quot;" />',
    );
  });
});

describe("escapeMdxText", () => {
  it("escapes braces and tag-like brackets typed as text", () => {
    expect(escapeMdxText("Usa {nombre} y <div> aquí")).toBe("Usa \\{nombre\\} y \\<div> aquí");
  });

  it("leaves code, comparisons, autolinks and existing escapes alone", () => {
    expect(escapeMdxText("`{x}` y 3 < 5 y <https://forabi.ai> y \\{ya}")).toBe(
      "`{x}` y 3 < 5 y <https://forabi.ai> y \\{ya\\}",
    );
    expect(escapeMdxText("```\n{x}\n```")).toBe("```\n{x}\n```");
  });
});
