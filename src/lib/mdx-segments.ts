// Splits a post body (MDX) into the pieces the /escribir block editor handles: plain
// Markdown, which BlockNote converts on its own, and the MDX elements it cannot
// (<Callout>, <Video> and anything else written by hand), so a post opened in the
// editor and saved again keeps them. No browser or server dependencies.

export type Segment =
  | { kind: "markdown"; text: string }
  | { kind: "callout"; text: string }
  | { kind: "video"; url: string; title: string }
  // MDX the editor does not model (a comment, another component): kept verbatim.
  | { kind: "raw"; source: string };

const CALLOUT_OPEN = /^<Callout\s*>\s*$/;
const CALLOUT_CLOSE = /^<\/Callout>\s*$/;
const VIDEO = /^<Video\b([^>]*)\/>\s*$/;
const COMMENT_OPEN = /^\{\/\*/;
const COMPONENT = /^<[A-Z]/;
const FENCE = /^(```|~~~)/;

function attribute(attributes: string, name: string): string {
  const match = attributes.match(new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`));
  return match ? (match[1] ?? match[2] ?? "") : "";
}

export function splitMdx(body: string): Segment[] {
  const lines = body.replace(/\r\n?/g, "\n").split("\n");
  const segments: Segment[] = [];
  let markdown: string[] = [];
  let inFence = false;

  const flush = () => {
    const text = markdown.join("\n").trim();
    if (text) segments.push({ kind: "markdown", text });
    markdown = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (FENCE.test(trimmed)) inFence = !inFence;
    if (inFence || FENCE.test(trimmed)) {
      markdown.push(line);
      continue;
    }

    if (CALLOUT_OPEN.test(trimmed)) {
      const end = lines.findIndex((other, j) => j > i && CALLOUT_CLOSE.test(other.trim()));
      if (end !== -1) {
        flush();
        segments.push({ kind: "callout", text: lines.slice(i + 1, end).join("\n").trim() });
        i = end;
        continue;
      }
    }

    const video = trimmed.match(VIDEO);
    if (video) {
      flush();
      segments.push({
        kind: "video",
        url: attribute(video[1], "url"),
        title: attribute(video[1], "title"),
      });
      continue;
    }

    if (COMMENT_OPEN.test(trimmed)) {
      const end = lines.findIndex((other, j) => j >= i && other.includes("*/}"));
      const last = end === -1 ? lines.length - 1 : end;
      flush();
      segments.push({ kind: "raw", source: lines.slice(i, last + 1).join("\n") });
      i = last;
      continue;
    }

    if (COMPONENT.test(trimmed)) {
      // A component up to its blank line: self-closing, or with its closing tag.
      let last = i;
      while (last + 1 < lines.length && lines[last + 1].trim() !== "") last++;
      flush();
      segments.push({ kind: "raw", source: lines.slice(i, last + 1).join("\n") });
      i = last;
      continue;
    }

    markdown.push(line);
  }
  flush();
  return segments;
}

const quote = (value: string) => value.replace(/"/g, "&quot;");

export function joinMdx(segments: Segment[]): string {
  return segments
    .map((segment) => {
      switch (segment.kind) {
        case "markdown":
          return segment.text.trim();
        case "callout":
          return `<Callout>\n${segment.text.trim()}\n</Callout>`;
        case "video":
          return segment.title
            ? `<Video url="${quote(segment.url)}" title="${quote(segment.title)}" />`
            : `<Video url="${quote(segment.url)}" />`;
        case "raw":
          return segment.source.trim();
      }
    })
    .filter(Boolean)
    .join("\n\n");
}

// MDX reads `{` as an expression and `<` before a letter as a tag. Text typed in the
// visual editor means them literally, so they are escaped outside code.
export function escapeMdxText(markdown: string): string {
  let inFence = false;
  return markdown
    .split("\n")
    .map((line) => {
      if (FENCE.test(line.trim())) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;
      return line
        .split(/(`[^`]*`)/)
        .map((part, index) =>
          index % 2 === 1
            ? part
            : part
                .replace(/(?<!\\)([{}])/g, "\\$1")
                .replace(/(?<!\\)<(?=[A-Za-z/!])(?!https?:)/g, "\\<"),
        )
        .join("");
    })
    .join("\n");
}
