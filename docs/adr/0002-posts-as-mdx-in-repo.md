# 0002 — Los posts son archivos MDX en el repo, validados en el build

- **Estado:** Reemplazado por 0008
- **Fecha:** 2026-10-10
- **Decide:** Alejandro Sarmiento

## Contexto

Los posts se escriben con Claude Code mediante el comando `/nuevo-post`, que aplica el checklist de
SEO de `CLAUDE.md`. Cada post necesita metadatos estrictos (title de 60 caracteres, description de
155, pilar, palabras clave, FAQ) porque de ellos salen el `<head>`, el JSON-LD, la imagen OG, el
sitemap, el RSS y `llms.txt`.

## Decisión

**Cada post es un archivo `content/blog/<slug>.mdx` con frontmatter validado por un schema de Zod
(`src/lib/posts.ts`). Un post inválido rompe el build.**

- El nombre del archivo es el slug y la URL es `/blog/<slug>`.
- `draft: true` muestra el post en desarrollo y lo excluye de producción, del sitemap y del RSS.
- `pnpm run seo:check` revisa además el contenido: enlaces a forabi.ai, enlaces internos, H2, sin H1.
- Los archivos que empiezan por `_` (como `_plantilla.mdx`) se ignoran.
- Los pilares son una lista cerrada en `src/lib/site.ts`; agregar uno es un cambio de código.

## Consecuencias

- **Más fácil:** publicar es un commit; el historial de git es el historial editorial; Claude Code
  escribe y valida el post en el mismo lugar; no hay CMS que mantener ni pagar.
- **Más difícil:** no se puede publicar desde el celular sin pasar por git.
- **Riesgo asumido:** con cientos de posts el build se alarga. Se revisa si pasa de un par de minutos.

## Alternativas consideradas

- **CMS headless (Sanity, Notion como CMS)** — rechazado: suma un servicio y una API para un solo
  autor que ya escribe en el repo.
- **Posts como objetos TypeScript** (como hoy en forabi.ai) — rechazado: escribir prosa larga dentro
  de arreglos de objetos es incómodo y no admite componentes en medio del texto.
