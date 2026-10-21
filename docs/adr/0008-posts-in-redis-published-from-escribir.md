# 0008 — Los posts viven en Redis y se publican desde /escribir

- **Estado:** Aceptado
- **Fecha:** 2026-10-21
- **Decide:** Alejandro Sarmiento
- **Reemplaza:** 0002

## Contexto

El ADR 0002 dejó los posts como archivos MDX en el repo: publicar era un commit, y solo se podía
hacer desde Claude Code. Alejandro quiere publicar desde una pantalla propia, también desde el
celular, y no quiere que los posts vivan en el repo. Una primera versión de esta decisión, que nunca
llegó a producción, escribía el MDX en GitHub con un token; se descartó para no depender de un
secreto con permiso de escritura sobre el repo.

## Decisión

**Cada post se guarda como su fuente MDX completa (frontmatter incluido) en Upstash Redis, el mismo
almacenamiento de los contadores (ADR 0003). Se publica y se edita desde `/escribir`, o con
`pnpm run posts:push` desde Claude Code. Las páginas se sirven desde caché y se refrescan solo
cuando un post cambia.**

- **Datos:** el hash `posts` tiene un campo por slug con el MDX. Cada vez que un post se reemplaza,
  la versión anterior queda en `posts:history:<slug>`, con la fecha del cambio como campo.
- **Validación:** el mismo schema de Zod y las reglas de `seo:check` (`src/lib/compose-post.ts`).
  Un post con problemas no se guarda; la pantalla dice qué corregir. Al leer, un post inválido se
  reporta y se omite, para que uno roto no tumbe el sitio.
- **Caché:** las páginas leen con `getAllPosts()` (`src/lib/blog.ts`, `"use cache"` con la etiqueta
  `posts` y `cacheLife("max")`). Al guardar se llama `revalidateTag("posts", { expire: 0 })` y la
  siguiente visita ve el cambio. Los posts que existen en el build se prerenderizan; uno nuevo se
  renderiza en su primera visita y queda en caché. Los endpoints de visitas, reacciones y
  comentarios leen Redis directo, sin caché.
- **Acceso a `/escribir`:** una contraseña (`ADMIN_PASSWORD`) abre una sesión en una cookie firmada
  con `SIGNING_SECRET` (`HttpOnly`, `SameSite=Strict`, 30 días). Cambiar la contraseña cierra todas
  las sesiones. Cinco intentos por IP cada 15 minutos.
- **Editar:** la dirección (slug) de un post no cambia; se conservan `datePublished` y `video`, y
  `dateModified` pasa a la fecha del día en Colombia.
- **Claude Code:** `/nuevo-post` escribe el MDX en `borradores/` (ignorado por git) y lo publica con
  `pnpm run posts:push borradores/<slug>.mdx`, que valida, escribe en Redis y llama a
  `/api/admin/revalidate` con `ADMIN_PASSWORD`. Necesita las variables en `.env.local`
  (`vercel env pull`).
- **Sin credenciales:** en desarrollo, la memoria arranca con `content/ejemplo.mdx` y la contraseña
  es `dev`. Si no hay ningún post, el build prerenderiza un slug de relleno que responde "no
  encontrado", porque Cache Components no acepta `generateStaticParams` vacío.
- **Fuera de alcance por ahora:** subir imágenes (cuando haga falta, a Vercel Blob con su ADR) y
  borrar posts desde la pantalla (se pasan a borrador).

## Consecuencias

- **Más fácil:** publicar y corregir desde cualquier dispositivo, y el cambio sale en segundos, sin
  esperar un despliegue. No hay token de GitHub.
- **Más difícil:** el historial editorial ya no está en git; queda en `posts:history:*`, que no se
  puede consultar desde la pantalla. `seo:check` revisa Redis solo si hay credenciales en
  `.env.local`; sin ellas revisa el post de ejemplo.
- **Riesgo asumido:** Redis pasa a guardar el contenido, no solo contadores. El plan gratuito de
  Upstash no hace respaldos automáticos; si el blog crece, se exporta periódicamente o se pasa a un
  plan con respaldos. Lo que se publica desde la pantalla no pasa por la revisión manual del
  checklist (fuentes enlazadas, tono); si baja la calidad, se publica como borrador por defecto.

## Alternativas consideradas

- **Escribir el MDX en GitHub desde la pantalla** — descartada: exige un token con permiso de
  escritura sobre el repo y cada post tarda un despliegue en salir.
- **CMS headless (Sanity, Notion)** — rechazado: suma un servicio y una cuenta para un solo autor;
  Redis ya está conectado.
- **Postgres (Neon)** — rechazado por ahora: más de lo que pide guardar unas decenas de textos. Se
  reconsidera si hacen falta búsquedas o relaciones entre posts.
- **Vercel Blob para el MDX** — rechazado: sirve para archivos; para texto que se lee entero y se
  valida, Redis basta. Se usará para imágenes.
