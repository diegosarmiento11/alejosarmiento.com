import { describe, expect, it } from "vitest";
import { slugify } from "./post-format";

describe("slugify", () => {
  it("drops accents, punctuation and stop words", () => {
    expect(slugify("¿Qué automatizar primero con IA en tu empresa?")).toBe(
      "automatizar-primero-ia-empresa",
    );
    expect(slugify("Mi año en 30 kilómetros")).toBe("ano-30-kilometros");
  });
});
