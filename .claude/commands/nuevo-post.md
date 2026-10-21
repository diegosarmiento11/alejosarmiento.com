---
description: Crea un post nuevo del blog con toda la optimización SEO y de entidad de CLAUDE.md
argument-hint: <tema o título del post, y opcionalmente el enlace al video de Instagram/TikTok>
---

Vas a crear un post nuevo para el blog de Alejandro Sarmiento sobre: $ARGUMENTS

Sigue estos pasos en orden y no te saltes ninguno.

1. **Lee CLAUDE.md completo** y aplica todas sus reglas, en especial las secciones 1 (identidad), 4 (checklist) y 5 (mapa de enlaces).

2. **Define antes de escribir** y muéstrame esto para aprobar:
   - Palabra clave principal y 3 a 5 secundarias
   - Pilar de contenido al que pertenece y, si es personal, la escena de apertura y el puente final
   - Title (60 caracteres o menos), meta description (155 o menos) y slug
   - Esquema de H2
   - Las 3 a 5 preguntas de la sección FAQ
   - Qué página de forabi.ai vas a enlazar y qué posts internos
   Espera mi aprobación antes de seguir.

3. **Si hay un video** de Instagram o TikTok en los argumentos: pídeme la transcripción si no la tienes, úsala como base, embebe el video con `<Video url="..." />` y declara `video` en el frontmatter para que se emita `VideoObject`.

4. **Escribe el post en MDX** en `borradores/<slug>.mdx` (carpeta ignorada por git), con frontmatter completo (title, description, datePublished, dateModified, pilar, keywords, faq). El slug es el nombre del archivo. Usa `content/plantilla.mdx` como base y quita `draft: true` cuando esté listo.

5. **La imagen OG** (1200x630) y la de historias (1080x1920) se generan solas con el título, el tema y tu foto. Después de publicar, ábrelas en `/blog/<slug>/opengraph-image` y `/blog/<slug>/story` y confirma que el título no se corta.

6. **Verifica las URLs** de forabi.ai y externas antes de dejarlas en el post. Si alguna no existe, avísame.

7. El sitemap, el RSS y `llms.txt` se regeneran solos al publicar; no los edites a mano.

8. **Publica** con `pnpm run posts:push borradores/<slug>.mdx`. Valida el post contra los que ya están en Redis antes de guardarlo; corrige todo lo que marque con ✗ y avísame de lo que marque con ! en posts viejos. Pide confirmación porque escribe en producción: muéstrame el resumen y espera mi visto bueno. Necesita `.env.local` con las variables de Upstash y `ADMIN_PASSWORD` (`vercel env pull .env.local`).

9. **Entrégame:**
   - La URL final del post
   - El resultado del seo:check
   - Un borrador de publicación para LinkedIn (máximo 1.300 caracteres, que termine con el enlace)
   - Un texto para Instagram (máximo 300 caracteres, con "link en la bio")
   - Recordatorio: enviar la URL a indexación en Google Search Console y correr `pnpm run newsletter:send <slug>`
