// Sends one post to the newsletter segment as a Resend Broadcast.
// Usage: pnpm run newsletter:send <slug> [--yes]
import { createInterface } from "node:readline/promises";
import { Resend } from "resend";
import { newPostEmail } from "../src/lib/email";
import { env } from "../src/lib/env";
import { loadPosts } from "../src/lib/posts";
import { absoluteUrl, postPath } from "../src/lib/site";

async function main() {
  const args = process.argv.slice(2);
  const slug = args.find((arg) => !arg.startsWith("--"));
  const skipConfirm = args.includes("--yes");

  if (!slug) throw new Error("Uso: pnpm run newsletter:send <slug> [--yes]");
  if (!env.resendApiKey || !env.emailFrom || !env.resendSegmentId) {
    throw new Error("Faltan RESEND_API_KEY, EMAIL_FROM o RESEND_SEGMENT_ID en el entorno.");
  }
  const post = loadPosts({ includeDrafts: true }).find((item) => item.slug === slug);
  if (!post) throw new Error(`No existe content/blog/${slug}.mdx`);
  if (post.draft) throw new Error(`"${slug}" es un borrador; no se envía.`);

  const url = absoluteUrl(postPath(post.slug));
  const live = await fetch(url, { method: "HEAD" }).catch(() => null);
  if (!live?.ok) throw new Error(`${url} no responde 200. Publica el post antes de enviarlo.`);

  if (!skipConfirm) {
    const prompt = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await prompt.question(
      `Enviar "${post.title}" a todos los suscriptores. Escribe "enviar" para confirmar: `,
    );
    prompt.close();
    if (answer.trim().toLowerCase() !== "enviar") {
      console.log("Cancelado. No se envió nada.");
      return;
    }
  }

  const resend = new Resend(env.resendApiKey);
  const created = await resend.broadcasts.create({
    name: `Post: ${post.slug}`,
    segmentId: env.resendSegmentId,
    from: env.emailFrom,
    previewText: post.description,
    ...newPostEmail({ title: post.title, description: post.description, url }),
  });
  if (created.error) throw new Error(`No se pudo crear el envío: ${created.error.message}`);

  const sent = await resend.broadcasts.send(created.data.id);
  if (sent.error) throw new Error(`No se pudo enviar: ${sent.error.message}`);
  console.log(`Enviado. Broadcast ${created.data.id}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
