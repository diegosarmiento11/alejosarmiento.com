# Blog personal de Alejandro Sarmiento — alejosarmiento.com

## Contexto

Alejandro publica sobre IA aplicada, software para empresas y su vida como fundador en Instagram (@alejosarmiento.ai) y
LinkedIn. Las redes sirven para descubrir un tema, no para explicarlo ni para que Google o un LLM lo
encuentren meses después. El blog es el lugar de las respuestas largas, en un dominio propio.

Lo que tiene que lograr:

1. **Que la gente entre directo a un post**, desde un buscador, un LLM o un enlace compartido, y lo
   lea sin obstáculos en el celular.
2. **Que cada página presente a Alejandro**: foto, quién es, redes, forabi.ai y un correo para
   colaboraciones.
3. **Que el lector deje algo**: una reacción, un comentario, o su correo para el newsletter.
4. **Que Alejandro sepa qué funciona**: visitas y reacciones por post.

## Decisiones cerradas

| Área | Decisión |
|---|---|
| Stack | Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind 4, shadcn/ui (ADR 0001) |
| Hosting | Vercel, plan Hobby. `main` es producción; cada rama, una preview (ADR 0001) |
| Dominio | `alejosarmiento.com`, hoy aparcado en Hostinger |
| Idioma | Solo español |
| Contenido | MDX en `content/blog/`, validado en el build; URL `/blog/<slug>` (ADR 0002) |
| Home | Feed tipo Substack: franja de autor compacta con suscripción, post destacado y lista |
| Estilo | Editorial claro: fondo papel, titulares en serif (Newsreader), interfaz en Inter, un acento |
| Visitas | Total del sitio (una por sesión) y lecturas por post, públicas (ADR 0003) |
| Reacciones | Me gusta · Me encanta · No me gustó; una por navegador, sin login, públicas (ADR 0003) |
| Comentarios | Propios, nombre y texto, moderados por correo antes de publicarse (ADR 0005) |
| Newsletter | Formulario propio con doble confirmación; envíos con Brevo, comando manual (ADR 0007) |
| Compartir | Historias de Instagram (imagen 1080×1920 + enlace copiado), LinkedIn y copiar enlace |
| SEO | Checklist de `CLAUDE.md` §4, aplicado por `seo:check`; JSON-LD, sitemap, RSS y `llms.txt` generados |
| Forma de trabajo | ADR + docs + `CLAUDE.md`, sin tablero ni trunk-based (ADR 0006) |

## Mapa del sitio

| Ruta | Qué es |
|---|---|
| `/` | Feed: autor, suscripción, último post, lista, temas |
| `/blog/<slug>` | Post: byline con foto, compartir, contenido, FAQ, reacciones, autor, comentarios, relacionados |
| `/pilares/<pilar>` | Posts de un tema (`diario-de-fundador`, `30-antes-de-los-30`, `kilometros`, `construir-con-ia`) |
| `/sobre-mi` | Página de entidad: foto grande, trayectoria, temas, contacto (`ProfilePage`) |
| `/blog/<slug>/opengraph-image` · `/story` | Imagen para redes (1200×630) y para historias (1080×1920) |
| `/sitemap.xml` · `/rss.xml` · `/llms.txt` · `/robots.txt` | Para buscadores, lectores RSS y LLM |
| `/newsletter/confirmar` · `/moderar` | Destino de los enlaces que llegan por correo; no se indexan |

## Cómo funciona cada pieza

**Lectura.** Los posts son HTML estático. Llevan `BlogPosting`, `BreadcrumbList`, `FAQPage` y, si hay
video, `VideoObject`. El `Person` de Alejandro se emite una vez en el layout y todo lo referencia por
`@id`.

**Contadores.** El navegador avisa una visita por sesión y una lectura por sesión y post. Como se
cuenta con JavaScript, los rastreadores no inflan los números.

**Reacciones.** Una cookie anónima identifica al navegador. Tocar otra reacción la cambia; tocar la
misma la quita. El conteo se actualiza al instante y se corrige si el servidor rechaza.

**Compartir en historias.** Instagram no ofrece un enlace web para publicar historias. En el celular
se abre la hoja de compartir del sistema con la imagen lista y el enlace copiado para el sticker; en
escritorio se muestra la imagen para descargar.

**Newsletter.** Correo → enlace firmado que vence en 7 días → botón de confirmar → contacto en
Brevo. Al publicar, `pnpm run newsletter:send <slug>` envía el aviso.

**Comentarios.** Quedan pendientes; a Alejandro le llega el texto con un enlace para aprobar o
eliminar.

## Fuera de alcance en v1

- Inglés, búsqueda interna y modo oscuro.
- Respuestas en hilo y avisos al lector cuando se aprueba su comentario.
- Panel de estadísticas: los números son públicos en cada post; para análisis se sumaría analítica aparte.
- Portadas por post: el diseño es tipográfico; la imagen OG se genera sola.

## Limitaciones conocidas

- Un slug que no existe muestra la página 404 con `noindex`, pero responde con estado 200: con
  Cache Components la carcasa de la ruta se envía antes de conocer el slug.
- Sin Redis los contadores viven en memoria y se pierden en cada despliegue. Es para desarrollo.

## Para salir a producción

1. Crear el proyecto en Vercel desde el repo y conectar `alejosarmiento.com` (DNS en Hostinger).
2. Agregar Upstash Redis desde el Marketplace de Vercel (define las variables solo).
3. En Brevo: autenticar el dominio, crear una lista y una API key.
4. Definir en Vercel `BREVO_API_KEY`, `BREVO_LIST_ID`, `EMAIL_FROM`, `OWNER_EMAIL` y
   `SIGNING_SECRET` (ver `.env.example`).
5. Reescribir el post de bienvenida con la voz de Alejandro y revisar los datos de `src/lib/site.ts`.
6. Registrar el sitio en Google Search Console y enviar el sitemap.
