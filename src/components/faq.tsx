import { ChevronDownIcon } from "lucide-react";

// Rendered as native <details> so every answer is in the HTML for crawlers.
export function Faq({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <section aria-labelledby="faq-title">
      <h2 id="faq-title" className="font-serif text-3xl font-medium tracking-tight">
        Preguntas frecuentes
      </h2>
      <div className="mt-4 divide-y border-y">
        {items.map((item) => (
          <details key={item.question} className="group py-4">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-serif text-xl leading-snug font-medium [&::-webkit-details-marker]:hidden">
              {item.question}
              <ChevronDownIcon className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 font-serif text-[1.125rem] leading-relaxed text-foreground/85">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
