# 0005 — Comentarios propios, sin login, moderados por correo

- **Estado:** Aceptado
- **Fecha:** 2026-10-10
- **Decide:** Alejandro Sarmiento

## Contexto

Se quieren comentarios en los posts. La audiencia viene sobre todo de Instagram y LinkedIn: dueños
de empresa y profesionales, la mayoría sin cuenta de GitHub. Un formulario abierto atrae spam, y un
comentario ofensivo publicado bajo el nombre de Alejandro es un costo real.

## Decisión

**Los comentarios se guardan en el mismo Redis de los contadores, se envían con nombre y texto, y
ninguno se publica hasta que Alejandro lo aprueba desde un enlace que le llega por correo.**

- Formulario: nombre (obligatorio) y comentario (hasta 1.500 caracteres). Sin correo, sin login.
  Texto plano: no se interpreta HTML ni Markdown.
- Defensa contra spam: campo trampa oculto, límite de peticiones por IP y moderación previa.
- Cada comentario nuevo llega al correo de Alejandro con su texto y un enlace firmado a `/moderar`,
  donde lo aprueba o lo elimina.
- Si falta Redis, Resend o `SIGNING_SECRET`, en producción los comentarios quedan cerrados (el
  formulario no se muestra). En desarrollo se aprueban solos para poder ver la interfaz.

## Consecuencias

- **Más fácil:** cualquiera comenta en segundos; nada se publica sin revisión; no hay un tercero ni
  scripts externos en la página.
- **Más difícil:** Alejandro debe aprobar a mano; sin hilos de respuesta ni notificaciones al lector.
- **Riesgo asumido:** si el volumen crece, moderar por correo cansa. Entonces se evalúa una bandeja
  de moderación o un servicio dedicado.

## Alternativas consideradas

- **Giscus (GitHub Discussions)** — rechazado: exige cuenta de GitHub, que la audiencia no tiene.
- **Disqus** — rechazado: anuncios, rastreadores y peso en la página.
- **Publicar sin moderación** — rechazado: el riesgo de spam y de contenido ofensivo no compensa.
