# 0008 — Publicar desde /escribir: la pantalla crea el MDX en GitHub

- **Estado:** Aceptado
- **Fecha:** 2026-10-21
- **Decide:** Alejandro Sarmiento

## Contexto

El ADR 0002 dejó los posts como archivos MDX en el repo y asumió una consecuencia: no se puede
publicar sin pasar por git. En la práctica eso obliga a publicar siempre desde Claude Code. Alejandro
quiere una pantalla propia para escribir y publicar, también desde el celular.

## Decisión

**`/escribir` es un formulario protegido con contraseña que valida el post con las mismas reglas del
build y de `seo:check`, y lo publica creando `content/blog/<slug>.mdx` en la rama `main` con la API
de GitHub. Vercel despliega ese commit como cualquier otro.** El ADR 0002 sigue vigente: git es la
fuente de los posts; solo cambia quién hace el commit.

- **Acceso:** una contraseña (`ADMIN_PASSWORD`) abre una sesión en una cookie firmada con
  `SIGNING_SECRET` (`HttpOnly`, `SameSite=Strict`, 30 días). Cambiar la contraseña cierra todas las
  sesiones. El inicio de sesión tiene límite de 5 intentos por IP cada 15 minutos.
- **GitHub:** un token "fine-grained" (`GITHUB_TOKEN`) con permiso Contents de lectura y escritura,
  limitado a este repo. La pantalla solo crea archivos nuevos; nunca sobrescribe un post.
- **Validación:** `src/lib/compose-post.ts` arma el frontmatter y aplica `frontmatterSchema` y
  `checkPost`. Un post con problemas no se publica; la pantalla dice qué corregir.
- **Sin credenciales:** en desarrollo la contraseña es `dev` y el archivo se escribe en
  `content/blog/`; en producción, sin token, la pantalla responde que no puede publicar.
- **La página es estática:** la sesión y el formulario se cargan en el navegador (ADR 0001 y 0003).
- **Fuera de alcance por ahora:** editar posts existentes, subir imágenes y declarar `video`. Eso
  se sigue haciendo con Claude Code.

## Consecuencias

- **Más fácil:** publicar desde cualquier dispositivo sin abrir el editor ni la terminal; el texto
  se guarda en el navegador mientras se escribe.
- **Más difícil:** hay un secreto más que cuidar. Un token filtrado permite escribir en el repo, por
  eso se limita a este repo y a Contents.
- **Riesgo asumido:** lo que se publica desde la pantalla no pasa por la revisión del checklist manual
  (fuentes enlazadas, tono). Si eso baja la calidad, se cambia a guardar borradores por defecto.

## Alternativas consideradas

- **CMS headless (Sanity, Notion)** — rechazado por las mismas razones del ADR 0002.
- **Guardar los posts en Redis** — rechazado: las páginas dejarían de ser estáticas (ADR 0001) y
  se perdería el historial de git.
- **Abrir un pull request en vez de escribir en `main`** — rechazado: para un solo autor agrega un
  paso sin revisor. El contenido ya puede ir directo a `main` (ADR 0006).
