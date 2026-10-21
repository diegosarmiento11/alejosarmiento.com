import type { Metadata } from "next";
import { PostEditor } from "@/components/post-editor";

export const metadata: Metadata = {
  title: "Escribir",
  robots: { index: false, follow: false },
};

// Static shell; the session and the editor load in the browser (ADR 0008).
export default function WritePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="mb-8 font-serif text-4xl font-medium tracking-tight">Escribir</h1>
      <PostEditor />
    </div>
  );
}
