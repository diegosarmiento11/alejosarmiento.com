import { describe, expect, it } from "vitest";
import { analyzePost, countWords, type PostDraft, suggestedStructure, TEMPLATE_MARK } from "./post-insights";

const filler = (words: number) =>
  Array.from({ length: Math.ceil(words / 60) }, () =>
    Array.from({ length: 60 }, (_, i) => (i === 0 ? "En forabi aprendí" : "texto")).join(" ") + ".",
  ).join("\n\n");

const good: PostDraft = {
  title: "Agentes de IA para clínicas: qué funciona",
  slug: "agentes-ia-clinicas",
  description:
    "Qué tareas de una clínica puede hacer un agente de IA hoy, cuánto cuesta montarlo y qué no conviene automatizar todavía.",
  pilar: "construir-con-ia",
  keywords: ["agentes de ia", "clínicas", "automatización"],
  faq: [
    { question: "¿Cuánto cuesta un agente?", answer: "Depende del volumen, pero arranca en pocos cientos de dólares." },
    { question: "¿Reemplaza a la recepción?", answer: "No: la libera de las tareas repetitivas del día." },
    { question: "¿Cuánto tarda montarlo?", answer: "Entre dos y seis semanas, según las integraciones." },
  ],
  body: [
    "Los agentes de ia ya agendan citas y responden dudas en clínicas reales. Yo los monto en forabi y mi equipo los mantiene. Te cuento qué funciona y qué no.",
    "## ¿Qué puede hacer un agente en una clínica?",
    filler(500),
    "- Agendar\n- Confirmar",
    "## ¿Cuánto cuesta?",
    `Según [un informe de 2026](https://example.com/informe), el 40 % de las clínicas ya prueba IA. ${filler(420)}`,
    "Más en [mi serie](/pilares/construir-con-ia), en [otro post](/blog/otro) y en [IA en operaciones](https://forabi.ai/servicios/ia-en-operaciones).",
  ].join("\n\n"),
};

const statuses = (draft: PostDraft, others = [{ slug: "otro", draft: false }]) =>
  Object.fromEntries(
    analyzePost(draft, others).groups.flatMap((group) => group.checks.map((c) => [`${group.id}.${c.id}`, c.status])),
  );

describe("analyzePost", () => {
  it("passes every check for a post that follows the checklist", () => {
    const failing = Object.entries(statuses(good)).filter(([, status]) => status !== "ok");
    expect(failing).toEqual([]);
    expect(analyzePost(good, [{ slug: "otro", draft: false }]).steps.every((step) => step.done)).toBe(true);
  });

  it("fails the opening when the body starts with a heading", () => {
    expect(statuses({ ...good, body: `## Empieza mal\n\n${good.body}` })["aeo.opening"]).toBe("fail");
  });

  it("counts headings that read as searches, accents included", () => {
    const body = good.body
      .replace("## ¿Qué puede hacer un agente en una clínica?", "## Qué puede hacer un agente")
      .replace("## ¿Cuánto cuesta?", "## Cómo se cobra");
    expect(statuses({ ...good, body })["aeo.question-h2"]).toBe("ok");
    expect(statuses({ ...good, body: body.replace("## Cómo se cobra", "## Precios") })["aeo.question-h2"]).toBe("ok");
    expect(
      statuses({ ...good, body: body.replace("## Cómo se cobra", "## Precios").replace("## Qué puede", "## Lo que puede") })[
        "aeo.question-h2"
      ],
    ).toBe("warn");
  });

  it("flags figures without a source link", () => {
    const body = good.body.replace("[un informe de 2026](https://example.com/informe)", "un informe de 2026");
    expect(statuses({ ...good, body })["geo.sources"]).toBe("warn");
  });

  it("only asks for an internal link when other posts exist", () => {
    const body = good.body.replace(", en [otro post](/blog/otro)", "");
    expect(statuses({ ...good, body })["geo.internal"]).toBe("fail");
    expect(statuses({ ...good, body }, [])["geo.internal"]).toBe("ok");
  });

  it("asks personal posts for the scene and the forabi bridge at the end", () => {
    const personal = { ...good, pilar: "diario-de-fundador" as const };
    const body = `[forabi](https://forabi.ai) ${good.body.replace(/\[IA en operaciones\]\([^)]*\)/, "IA")}`;
    const insights = analyzePost({ ...personal, body }, [{ slug: "otro", draft: false }]);
    expect(insights.steps.find((step) => step.id === "bridge")?.done).toBe(false);
    expect(insights.steps.find((step) => step.id === "opening")?.label).toBe("Abre con la escena");
  });

  it("asks 30 antes de los 30 titles for the entry number", () => {
    const entry = { ...good, pilar: "30-antes-de-los-30" as const };
    expect(statuses(entry)["seo.entry"]).toBe("warn");
    expect(statuses({ ...entry, title: "#7 de 30: correr una maratón" })["seo.entry"]).toBe("ok");
  });

  it("keeps the template step open while a mark is left", () => {
    const insights = analyzePost({ ...good, body: suggestedStructure("kilometros") });
    expect(insights.steps.find((step) => step.id === "clean")?.done).toBe(false);
  });
});

describe("countWords", () => {
  it("ignores code, link targets and markup", () => {
    expect(countWords("## Hola mundo\n\n[dos palabras](https://x.com) `codigo`\n\n```\nfuera\n```")).toBe(4);
  });
});

describe("suggestedStructure", () => {
  it("marks every line for replacement and has at least two H2", () => {
    for (const pilar of ["diario-de-fundador", "construir-con-ia"] as const) {
      const structure = suggestedStructure(pilar);
      expect(structure.match(/^## /gm)?.length).toBeGreaterThanOrEqual(2);
      expect(structure.split("\n").filter(Boolean).every((line) => line.includes(TEMPLATE_MARK))).toBe(true);
    }
  });

  it("gives personal posts a section for the reader and closes with a question to them", () => {
    const structure = suggestedStructure("diario-de-fundador");
    expect(structure).toMatch(/^## .*aplicarlo tú/m);
    expect(structure).toMatch(/pregunta al lector/);
    expect(structure.indexOf("aplicarlo tú")).toBeLessThan(structure.indexOf("forabi.ai"));
  });
});
