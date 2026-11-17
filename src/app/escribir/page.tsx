import type { Metadata } from "next";
import { PostEditor } from "@/components/post-editor";

export const metadata: Metadata = {
  title: "Escribir",
  robots: { index: false, follow: false },
};

// Static shell; the session and the editor load in the browser (ADR 0008).
export default function WritePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="mb-6 text-sm font-medium uppercase tracking-wide text-muted-foreground">Escribir</h1>
      <PostEditor />
    </div>
  );
}
