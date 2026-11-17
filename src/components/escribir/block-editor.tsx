"use client";

import { useEffect, useRef } from "react";
import {
  BlockNoteSchema,
  type Block,
  createHeadingBlockSpec,
  defaultBlockSpecs,
  filterSuggestionItems,
  insertOrUpdateBlockForSlashMenu,
  type PartialBlock,
} from "@blocknote/core";
import { es } from "@blocknote/core/locales";
import {
  createReactBlockSpec,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import { BracesIcon, LightbulbIcon, PlayIcon } from "lucide-react";
import { escapeMdxText, joinMdx, type Segment, splitMdx } from "@/lib/mdx-segments";

// The post body as blocks, Notion style, saved as the same MDX the blog renders.
// Plain Markdown goes through BlockNote's converter; <Callout>, <Video> and any
// other MDX are blocks of their own so a round trip keeps them (src/lib/mdx-segments.ts).

const callout = createReactBlockSpec(
  { type: "callout", propSchema: {}, content: "inline" },
  {
    render: ({ contentRef }) => (
      <div className="my-1 flex w-full gap-3 rounded-xl border-l-2 border-brand bg-secondary/70 px-4 py-3">
        <LightbulbIcon className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
        <div ref={contentRef} className="min-w-0 flex-1" />
      </div>
    ),
  },
);

const videoEmbed = createReactBlockSpec(
  {
    type: "videoEmbed",
    propSchema: { url: { default: "" }, title: { default: "" } },
    content: "none",
  },
  {
    render: ({ block, editor }) => (
      <div contentEditable={false} className="my-1 w-full space-y-2 rounded-xl border bg-card p-3 font-sans">
        <p className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
          <PlayIcon className="size-3.5" aria-hidden /> Video embebido
        </p>
        <input
          aria-label="URL del video"
          placeholder="https://www.instagram.com/reel/… · YouTube · TikTok"
          defaultValue={block.props.url}
          onBlur={(event) => editor.updateBlock(block, { props: { url: event.target.value.trim() } })}
          className="w-full rounded-md border bg-background px-2 py-1.5 font-mono text-sm"
        />
        <input
          aria-label="Título del video"
          placeholder="Título del video"
          defaultValue={block.props.title}
          onBlur={(event) => editor.updateBlock(block, { props: { title: event.target.value.trim() } })}
          className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
        />
      </div>
    ),
  },
);

const rawMdx = createReactBlockSpec(
  { type: "rawMdx", propSchema: { source: { default: "" } }, content: "none" },
  {
    render: ({ block, editor }) => (
      <div contentEditable={false} className="my-1 w-full space-y-1.5 rounded-xl border border-dashed p-3 font-sans">
        <p className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
          <BracesIcon className="size-3.5" aria-hidden /> MDX
        </p>
        <textarea
          aria-label="Código MDX"
          defaultValue={block.props.source}
          rows={Math.min(8, block.props.source.split("\n").length + 1)}
          onBlur={(event) => editor.updateBlock(block, { props: { source: event.target.value } })}
          className="w-full resize-y rounded-md bg-muted/60 px-2 py-1.5 font-mono text-xs"
        />
      </div>
    ),
  },
);

// No uploads yet (ADR 0008), so no file, audio or native video blocks; the title is
// the only H1, so headings start at H2.
const {
  paragraph,
  bulletListItem,
  numberedListItem,
  checkListItem,
  quote,
  codeBlock,
  table,
  image,
  divider,
} = defaultBlockSpecs;

const schema = BlockNoteSchema.create({
  blockSpecs: {
    paragraph,
    bulletListItem,
    numberedListItem,
    checkListItem,
    quote,
    codeBlock,
    table,
    image,
    divider,
    heading: createHeadingBlockSpec({ levels: [2, 3], defaultLevel: 2, allowToggleHeadings: false }),
    callout: callout(),
    videoEmbed: videoEmbed(),
    rawMdx: rawMdx(),
  },
});

type Editor = typeof schema.BlockNoteEditor;
type EditorBlock = Block<typeof schema.blockSchema, typeof schema.inlineContentSchema, typeof schema.styleSchema>;
type EditorPartialBlock = PartialBlock<
  typeof schema.blockSchema,
  typeof schema.inlineContentSchema,
  typeof schema.styleSchema
>;

function toBlocks(editor: Editor, body: string): EditorPartialBlock[] {
  return splitMdx(body).flatMap((segment): EditorPartialBlock[] => {
    switch (segment.kind) {
      case "markdown":
        return editor.tryParseMarkdownToBlocks(segment.text);
      case "callout": {
        // A callout holds one paragraph of inline text; extra paragraphs are joined.
        const parsed = editor.tryParseMarkdownToBlocks(segment.text);
        const content = parsed.flatMap((block, index) => {
          const inline = Array.isArray(block.content) ? block.content : [];
          return index === 0 ? inline : [{ type: "text" as const, text: " ", styles: {} }, ...inline];
        });
        return [{ type: "callout", content }];
      }
      case "video":
        return [{ type: "videoEmbed", props: { url: segment.url, title: segment.title } }];
      case "raw":
        return [{ type: "rawMdx", props: { source: segment.source } }];
    }
  });
}

function toMdx(editor: Editor): string {
  const segments: Segment[] = [];
  let run: EditorBlock[] = [];
  const flush = () => {
    if (run.length) segments.push({ kind: "markdown", text: escapeMdxText(editor.blocksToMarkdownLossy(run)) });
    run = [];
  };
  for (const block of editor.document) {
    if (block.type === "callout") {
      flush();
      const text = editor.blocksToMarkdownLossy([{ type: "paragraph", content: block.content }]);
      segments.push({ kind: "callout", text: escapeMdxText(text) });
    } else if (block.type === "videoEmbed") {
      flush();
      if (block.props.url) segments.push({ kind: "video", url: block.props.url, title: block.props.title });
    } else if (block.type === "rawMdx") {
      flush();
      segments.push({ kind: "raw", source: block.props.source });
    } else {
      run.push(block);
    }
  }
  flush();
  return joinMdx(segments);
}

const dictionary = {
  ...es,
  placeholders: {
    ...es.placeholders,
    emptyDocument: "Escribe, o pulsa / para insertar un subtítulo, una lista, un destacado o un video",
    default: "Escribe, o pulsa / para ver los bloques",
    heading: "Subtítulo: redáctalo como lo que la gente busca",
  },
};

export function BlockEditor({
  initialBody,
  onChange,
}: {
  // Read once; remount the component (key) to load another post.
  initialBody: string;
  onChange: (body: string) => void;
}) {
  const editor = useCreateBlockNote({ schema, dictionary });
  const loaded = useRef(false);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const blocks = toBlocks(editor, initialBody);
    if (blocks.length) editor.replaceBlocks(editor.document, blocks);
    loaded.current = true;
    // initialBody is read once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  return (
    <BlockNoteView
      editor={editor}
      theme="light"
      slashMenu={false}
      onChange={() => {
        if (loaded.current) onChangeRef.current(toMdx(editor));
      }}
      className="-mx-2 min-h-[50vh] sm:-mx-12"
    >
      <SuggestionMenuController
        triggerCharacter="/"
        getItems={async (query) =>
          filterSuggestionItems(
            [
              ...getDefaultReactSlashMenuItems(editor),
              {
                title: "Destacado",
                subtext: "Una idea que el lector debe recordar. Una vez por post.",
                aliases: ["callout", "destacado", "nota"],
                group: "Blog",
                icon: <LightbulbIcon size={18} />,
                onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "callout" }),
              },
              {
                title: "Video",
                subtext: "Reel de Instagram, YouTube o TikTok.",
                aliases: ["video", "reel", "youtube", "tiktok"],
                group: "Blog",
                icon: <PlayIcon size={18} />,
                onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "videoEmbed" }),
              },
            ],
            query,
          )
        }
      />
    </BlockNoteView>
  );
}
