# 0001 — Next.js con páginas estáticas, desplegado en Vercel

- **Estado:** Aceptado
- **Fecha:** 2026-10-10
- **Decide:** Alejandro Sarmiento

## Contexto

El blog existe para que un lector llegue directo a un post desde un buscador, un LLM o una red
social. Eso pide tres cosas: HTML completo en la primera respuesta (para Google y para los
rastreadores de los LLM, que no ejecutan JavaScript), carga rápida en móvil y metadatos por post
(Open Graph, JSON-LD, sitemap, RSS, `llms.txt`). Además necesita unos pocos endpoints que escriben:
visitas, reacciones, comentarios y suscripción.

Lo mantiene una persona, con ayuda de Claude Code, y debe costar cero mientras el tráfico sea
pequeño. forabi.ai ya corre en Next.js sobre Vercel, así que el conocimiento y la cuenta existen.

## Decisión

**El sitio es una aplicación Next.js 16 (App Router) cuyas páginas de contenido se prerenderizan en
el build, desplegada en Vercel en el plan Hobby.**

- Feed, posts, pilares y "Sobre mí" son estáticos. Lo que cambia por lector o por minuto se carga en
  el navegador desde `src/app/api/` (ADR 0003).
- La interfaz usa Tailwind 4 y componentes de shadcn/ui.
- Las imágenes OG y las de historias de Instagram se generan con `next/og` a partir del frontmatter.
- `main` despliega a producción; cada rama, a una URL de preview.

## Consecuencias

- **Más fácil:** un post es HTML en la CDN, sin base de datos en el camino de lectura; las previews
  permiten revisar en el celular antes de publicar; mismo stack que forabi.ai.
- **Más difícil:** Next.js 16 cambió frente a versiones anteriores (Cache Components). Antes de
  tocar caché o rutas se lee la guía en `node_modules/next/dist/docs/`.
- **Riesgo asumido:** el plan Hobby de Vercel es para uso personal y no comercial. Un blog personal
  que enlaza a forabi.ai cabe; si el blog pasa a vender (patrocinios, productos), se sube a Pro o se
  mueve a Cloudflare. Nada del código depende de APIs exclusivas de Vercel salvo `next/og`.

## Alternativas consideradas

- **Cloudflare (Workers/Pages)** — rechazado por ahora: gratis y sin restricción comercial, pero
  Next.js corre mediante un adaptador y suma fricción. Es el plan B documentado.
- **Astro** — rechazado: excelente para contenido, pero es un stack distinto al de forabi.ai y los
  componentes de shadcn son de React.
- **Substack o beehiiv como blog** — rechazado: el dominio, el diseño, los datos estructurados y la
  lista de suscriptores quedarían en manos de la plataforma.
