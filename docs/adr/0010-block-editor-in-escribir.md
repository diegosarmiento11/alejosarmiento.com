# 0010 — /escribir es un editor de bloques con un panel de AEO, AIO y GEO en vivo

- **Estado:** Aceptado
- **Fecha:** 2026-11-16
- **Decide:** Alejandro Sarmiento

## Contexto

`/escribir` era un formulario: campos uno debajo del otro y el cuerpo en un `<textarea>` con
Markdown crudo. La revisión solo corría al pulsar "Revisar". Alejandro quiere escribir como en Notion
(propiedades arriba, el texto en bloques) y ver mientras escribe qué le falta al post para que lo
citen los buscadores y los motores de IA. El Docu de forabi-spencer ya resolvió algo parecido con
BlockNote y un bloque de propiedades.

## Decisión

**El cuerpo se escribe en BlockNote (`@blocknote/shadcn`) y se sigue guardando como el mismo MDX en
Redis (ADR 0008). Un panel a la derecha, en una hoja inferior en el celular, muestra la hoja de ruta
del post y los chequeos de AEO, AIO, GEO y SEO calculados en el navegador, sin servicios externos.**

- **Página:** título grande, propiedades en filas (estado, serie, dirección, palabras clave,
  descripción), el cuerpo en bloques y las preguntas frecuentes al final. El formulario anterior
  desaparece; subir, descargar y eliminar se conservan.
- **MDX como fuente:** `src/lib/mdx-segments.ts` parte el cuerpo en Markdown y elementos MDX.
  BlockNote convierte el Markdown; `<Callout>` y `<Video>` son bloques propios y cualquier otro MDX
  (un comentario, otro componente) queda en un bloque "MDX" que se guarda tal cual. `{`, `}` y `<`
  escritos como texto se escapan para que MDX no los lea como código.
- **Bloques:** sin H1 (el título lo es), sin archivos, audio ni video nativo, porque no hay subida
  de archivos (ADR 0008).
- **Chequeos:** `src/lib/post-insights.ts`. Los marcados "bloquea" repiten lo que el servidor
  rechaza (`compose-post`, `seo-check`); los "recomendado" vienen de la checklist de CLAUDE.md §4.
  El servidor sigue siendo el que decide si un post se guarda.
- **Hoja de ruta:** nueve pasos según la serie (escena y puente a forabi en las personales,
  respuesta de entrada en las demás) y una estructura sugerida opcional, con textos marcados con
  ✎. `seo:check` rechaza un post que todavía tenga ✎.

## Consecuencias

- **Más fácil:** escribir y corregir desde el celular sin saber Markdown, y ver en cada momento qué
  falta para publicar.
- **Más difícil:** la conversión entre bloques y Markdown es "lossy": un post abierto y guardado
  puede cambiar de forma (por ejemplo `*` en lugar de `-` en las listas), aunque no de contenido. Un
  destacado guarda un solo párrafo.
- **Riesgo asumido:** BlockNote pesa en el bundle de `/escribir`, que solo abre el autor. Los
  chequeos son heurísticos (preguntas en los H2, cifras sin fuente); si dan falsos positivos se
  ajustan en `post-insights.ts` con su test.

## Alternativas consideradas

- **Guardar el JSON de BlockNote** en vez del MDX — rechazada: rompe `posts:push`, `/nuevo-post` y
  la descarga del `.mdx`.
- **`@blocknote/mantine`, como en spencer** — rechazada: trae Mantine y su CSS; la variante de shadcn
  usa Tailwind 4, como el resto del sitio.
- **Sugerencias con IA en el panel** — fuera de alcance por ahora: suma una API externa y una clave,
  y necesitaría su propio ADR.
