# CLAUDE.md — alejosarmiento.com

Blog personal de Alejandro Sarmiento. Un lector llega a un post desde Google, un LLM, Instagram o
LinkedIn, lo lee, sabe quién lo escribió y deja algo: una reacción, un comentario o su correo. Este
archivo resume las reglas del repo; el detalle vive en los documentos que enlaza, y si algo difiere,
mandan ellos.

- Diseño y alcance: [`docs/plan.md`](docs/plan.md) · Decisiones: [`docs/adr/`](docs/adr/)
- Cuando algo no esté cubierto aquí ni en esos documentos, se propone un ADR; no se decide en silencio.
- Post nuevo: comando `/nuevo-post <tema>` ([`.claude/commands/nuevo-post.md`](.claude/commands/nuevo-post.md)).

@AGENTS.md

## 1. Identidad

La fuente única es [`src/lib/site.ts`](src/lib/site.ts). Nombre, cargo, bio, foto, redes y correo se
leen de ahí; ningún componente ni post los escribe a mano.

- **Nombre:** siempre "Alejandro Sarmiento", completo, en title, byline, JSON-LD e imágenes OG. Nunca
  "Alejo" ni "A. Sarmiento" en esos lugares.
- **Frase fija:** "Alejandro Sarmiento, fundador de forabi.ai y organizador de Claude Colombia". Hay
  homónimos; el nombre va acompañado de esa frase en títulos, descripciones y perfiles. El sitio se
  diferencia diciendo quién es Alejandro, nunca aludiendo a otras personas.
- **Quién es, en una línea:** arquitecto de software, fundador y CEO de forabi.ai, organizador de
  Claude Colombia.
- **Hechos que se pueden afirmar:** los de `site.ts` (`author.facts`). Una cifra o credencial que no
  esté ahí no se escribe; se le pregunta a Alejandro y se agrega primero a `site.ts`.
- **Cada página lo presenta:** foto profesional y bio corta en el feed, byline con foto arriba del
  post, tarjeta de autor al final, y `Person` en JSON-LD con el mismo `@id` en todo el sitio.
- **Correo de colaboraciones** visible en el pie de todas las páginas y en la tarjeta de autor.
- **Voz:** primera persona, español neutro de Colombia, de tú. Frases cortas, ejemplos reales, sin
  relleno ni promesas. Se escribe para un dueño de empresa o un desarrollador, no para un buscador.

## 2. Stack y comandos

Next.js 16 (App Router, Cache Components), React 19, TypeScript estricto, Tailwind 4, shadcn/ui
(sobre Base UI), MDX en el repo, Upstash Redis para contadores, Brevo para correo, Vercel. Las
razones están en los ADR 0001 a 0007.

```bash
pnpm install
pnpm dev                 # http://localhost:3000, sin credenciales: todo corre en memoria
pnpm run verify          # lo que se exige antes de publicar: lint · typecheck · test · seo:check · build
pnpm run verify:quick    # durante el trabajo: typecheck + test
pnpm run seo:check       # valida el frontmatter y el contenido de cada post
pnpm run newsletter:send <slug>   # envía el post a los suscriptores (pide confirmación)
```

## 3. Estructura y reglas de código

```
content/blog/<slug>.mdx   un archivo por post; el nombre del archivo es el slug
src/lib/site.ts           identidad, redes, pilares y mapa de enlaces
src/lib/env.ts            el único lugar que lee process.env
src/lib/posts.ts          lee y valida los posts (Zod)
src/lib/store.ts          Redis (Upstash) o memoria si no hay credenciales
src/lib/engagement.ts     visitas, reacciones y comentarios
src/lib/jsonld.ts         datos estructurados
src/app/                  rutas; src/app/api/ son los únicos endpoints que escriben
src/components/ui/        shadcn, generado por el CLI; se retoca lo mínimo
scripts/                  seo-check y envío del newsletter
```

- **Las páginas de contenido son estáticas.** Visitas, reacciones y comentarios se cargan en el
  navegador contra `src/app/api/`. Un post nunca espera a Redis para pintarse (ADR 0003).
- **`process.env` solo en `src/lib/env.ts`.** Toda variable nueva va ahí y a `.env.example`.
- **El sitio arranca y compila sin credenciales.** Sin Redis se usa memoria; sin Brevo, el newsletter
  y los comentarios responden que no están disponibles en producción y se simulan en desarrollo.
- **Componentes de shadcn antes que propios.** Si existe en shadcn, se agrega con
  `pnpm dlx shadcn@latest add <componente>`.
- **Responsive primero en móvil:** la mayoría llega desde Instagram. Todo se revisa a 375 px.
- **Nada de datos personales en logs:** ni correos de suscriptores ni cuerpos de comentarios.
- **Tests** (`*.test.ts` al lado del archivo): obligatorios para la lógica de `src/lib/`. Se prueba
  comportamiento nuestro, no el framework. Todo bug se arregla con su test de regresión.
- **Nunca se suprime ni debilita un check** para que `verify` pase.

## 4. Checklist de cada post

`pnpm run seo:check` hace cumplir lo marcado con ⚙; el resto se revisa a mano.

- ⚙ `title` de 60 caracteres o menos, con la palabra clave principal cerca del inicio.
- ⚙ `description` de 155 caracteres o menos, que responda la intención de búsqueda.
- ⚙ Slug en minúsculas, con guiones, sin tildes ni palabras vacías; igual al nombre del archivo.
- ⚙ `pilar` válido (los de `site.ts`), `keywords` con 3 a 6 entradas, `datePublished` y `dateModified`.
- ⚙ `faq` con 3 a 5 preguntas reales; se pintan al final y salen como `FAQPage`.
- ⚙ Al menos un enlace a forabi.ai y, cuando exista otro post, al menos un enlace interno.
- ⚙ Sin H1 en el cuerpo (el título ya lo es) y con al menos dos H2.
- La respuesta a la pregunta del título va en el primer párrafo, en 2 o 3 frases que un LLM pueda
  citar sin contexto.
- H2 redactados como lo que la gente busca o pregunta. Párrafos de 2 a 4 líneas.
- Toda cifra o afirmación externa lleva su fuente enlazada. Las URLs se verifican antes de publicar.
- Imágenes con `alt` descriptivo. Si el post nace de un video, se embebe y se declara `video` en el
  frontmatter para emitir `VideoObject`.
- Al actualizar un post se cambia `dateModified`.
- Después de publicar: enviar la URL a indexación en Google Search Console y correr
  `newsletter:send`.

Sitemap, RSS, `llms.txt`, la imagen OG (1200×630) y la imagen para historias (1080×1920) se generan
solas en el build a partir del frontmatter.

## 5. Mapa de enlaces

Los destinos viven en `site.ts` (`linkMap`). Se enlaza con texto descriptivo, nunca "clic aquí".

| Cuando el post habla de | Enlaza a |
|---|---|
| Automatizar procesos u operación con IA, agentes | https://forabi.ai/servicios/ia-en-operaciones |
| Construir software propio | https://forabi.ai/servicios/software-a-la-medida |
| Conectar sistemas (Siigo, ERP, CRM) | https://forabi.ai/servicios/integraciones |
| Clínicas, IPS, agendamiento médico | https://forabi.ai/health |
| Un resultado concreto con un cliente | https://forabi.ai/casos |
| Quién es forabi | https://forabi.ai/sobre |

- **Internos:** cada post enlaza a su pilar (`/pilares/<pilar>`) y a 1 a 3 posts relacionados. Al
  publicar uno nuevo, se revisa qué posts viejos deberían enlazarlo.
- **Perfil:** `/sobre-mi` es la página de entidad; los posts no repiten la bio larga, la enlazan.
- Antes de agregar una URL nueva de forabi.ai a la tabla, se comprueba que responde 200.

## 6. Flujo de trabajo

Proyecto de una persona: sin tablero, sin feature flags y sin trunk-based (ADR 0006).

- Cambios de código en una rama corta desde `main`; el contenido (un post) puede ir directo a `main`.
- Conventional Commits en inglés (`feat`, `fix`, `content`, `docs`, `chore`); el cuerpo explica el porqué.
- **Nunca `git push` sin confirmación explícita.** Se commitea local, se reporta el hash y se espera.
- Vercel despliega `main` a producción y cada rama a una preview. Antes de mezclar: `pnpm run verify`
  en verde y la preview revisada en móvil.
- **Nunca declares verde sin haber corrido el comando y visto la salida.**
- Una decisión que cambia el stack, un servicio externo o cómo se guardan datos de lectores se
  escribe como ADR antes de implementarla.

## 7. Idioma

Código, comentarios, commits y nombres de archivo en inglés. Contenido, interfaz, documentación y ADRs
en español.
