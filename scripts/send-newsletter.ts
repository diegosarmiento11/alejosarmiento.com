// Sends one post to the newsletter list as a Brevo campaign.
// Usage: pnpm run newsletter:send <slug> [--yes]
import { createInterface } from "node:readline/promises";
import { newPostEmail, sendCampaign } from "../src/lib/email";
import { env } from "../src/lib/env";
import { findPost } from "../src/lib/posts";
import { absoluteUrl, postPath } from "../src/lib/site";
import { getStore } from "../src/lib/store";

async function main() {
  const args = process.argv.slice(2);
  const slug = args.find((arg) => !arg.startsWith("--"));
  const skipConfirm = args.includes("--yes");

  if (!slug) throw new Error("Uso: pnpm run newsletter:send <slug> [--yes]");
  if (!env.brevoApiKey || !env.emailFrom || !env.brevoListId) {
    throw new Error("Faltan BREVO_API_KEY, EMAIL_FROM o BREVO_LIST_ID en el entorno.");
  }
  const post = await findPost(getStore(), slug);
  if (!post) throw new Error(`No existe el post "${slug}" en Redis.`);
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

  const email = newPostEmail({ title: post.title, description: post.description, url });
  const id = await sendCampaign({
    name: `Post: ${post.slug}`,
    previewText: post.description,
    ...email,
  });
  console.log(`Enviado. Campaña ${id}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
