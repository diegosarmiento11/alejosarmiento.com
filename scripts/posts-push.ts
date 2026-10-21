// Saves MDX files as posts in Redis and refreshes the site. This is how Claude Code
// publishes (/nuevo-post) and how the posts that lived in the repo were migrated.
// Usage: pnpm run posts:push <archivo.mdx | carpeta>... [--yes] [--url https://…]
// Needs the Upstash variables and ADMIN_PASSWORD in .env.local (vercel env pull).
import fs from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { env, hasRedis } from "../src/lib/env";
import { loadPosts, parsePost, type Post, savePost } from "../src/lib/posts";
import { checkAll } from "../src/lib/seo-check";
import { SITE_URL } from "../src/lib/site";
import { getStore } from "../src/lib/store";

function mdxFiles(target: string): string[] {
  if (fs.statSync(target).isDirectory()) {
    return fs
      .readdirSync(target)
      .filter((file) => file.endsWith(".mdx") && !file.startsWith("_"))
      .map((file) => path.join(target, file));
  }
  return [target];
}

async function main() {
  const args = process.argv.slice(2);
  const urlIndex = args.indexOf("--url");
  const siteUrl = urlIndex >= 0 ? args[urlIndex + 1] : SITE_URL;
  const targets = args.filter(
    (arg, i) => !arg.startsWith("--") && (urlIndex < 0 || i !== urlIndex + 1),
  );
  if (targets.length === 0) {
    throw new Error("Uso: pnpm run posts:push <archivo.mdx | carpeta>... [--yes] [--url https://…]");
  }
  if (!hasRedis) {
    throw new Error("Faltan las variables de Upstash. Corre `vercel env pull .env.local`.");
  }

  const files = targets.flatMap(mdxFiles);
  const pushed = files.map((file) => ({
    post: parsePost(path.basename(file, ".mdx"), fs.readFileSync(file, "utf8")),
    source: fs.readFileSync(file, "utf8"),
  }));

  const store = getStore();
  const stored = await loadPosts(store, { includeDrafts: true });
  const slugs = new Set(pushed.map(({ post }) => post.slug));
  const merged: Post[] = [
    ...stored.filter((post) => !slugs.has(post.slug)),
    ...pushed.map(({ post }) => post),
  ];
  const issues = checkAll(merged);
  const blocking = issues.filter((issue) => slugs.has(issue.slug));
  for (const issue of issues) {
    console.log(`${slugs.has(issue.slug) ? "✗" : "!"} ${issue.slug}: ${issue.message}`);
  }
  if (blocking.length > 0) throw new Error("Corrige los problemas marcados con ✗ y vuelve a intentar.");

  for (const { post } of pushed) {
    const action = stored.some((item) => item.slug === post.slug) ? "actualiza" : "crea";
    console.log(`- ${action} ${post.slug}${post.draft ? " (borrador)" : ""}`);
  }
  if (!args.includes("--yes")) {
    const prompt = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await prompt.question('Esto escribe en Redis de producción. Escribe "publicar": ');
    prompt.close();
    if (answer.trim().toLowerCase() !== "publicar") {
      console.log("Cancelado. No se guardó nada.");
      return;
    }
  }

  const now = new Date();
  for (const { post, source } of pushed) await savePost(store, post.slug, source, now);
  console.log(`Guardado(s) ${pushed.length} post(s) en Redis.`);

  const response = await fetch(`${siteUrl}/api/admin/revalidate`, {
    method: "POST",
    headers: { authorization: `Bearer ${env.adminPassword ?? ""}` },
  }).catch(() => null);
  console.log(
    response?.ok
      ? `${siteUrl} ya muestra los cambios.`
      : `No se pudo refrescar ${siteUrl} (¿falta ADMIN_PASSWORD?). Los cambios salen en el próximo despliegue.`,
  );
}

main().catch((error) => {
  console.error(`✗ ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
