# 0003 — Visitas, reacciones y comentarios en Redis, anónimos y cargados en el navegador

- **Estado:** Aceptado
- **Fecha:** 2026-10-10
- **Decide:** Alejandro Sarmiento

## Contexto

Cada post muestra públicamente cuántas lecturas tiene y tres reacciones (me gusta, no me gusta, me
encanta); el sitio muestra su total de visitas. Sirven como retroalimentación para Alejandro y como
prueba social para el lector. No hay cuentas de usuario y no se quiere pedir login para reaccionar.

Son contadores: incrementos pequeños y frecuentes. Si la página los leyera en el servidor, cada post
dejaría de ser estático (ADR 0001).

## Decisión

**Los contadores viven en Upstash Redis (plan gratuito, vía Vercel Marketplace) y se leen y escriben
desde el navegador contra `src/app/api/`. El lector se identifica con una cookie anónima.**

- **Visita al sitio:** una por sesión de navegador. **Lectura de un post:** una por sesión y post.
  Se cuentan con JavaScript, así que los rastreadores que no lo ejecutan no inflan el número.
- **Reacciones:** una por navegador y post, guardada contra una cookie `vid` aleatoria (`HttpOnly`,
  un año). El lector puede cambiarla o quitarla. No se guarda IP ni ningún dato personal.
- **Límite de peticiones** por IP y ventana de tiempo en todos los endpoints que escriben. La IP solo
  se usa como llave temporal del límite; expira sola.
- Todo acceso pasa por la interfaz `Store` (`src/lib/store.ts`). Sin credenciales se usa una
  implementación en memoria, de modo que el sitio corre y los tests pasan sin Redis.
- Los endpoints solo aceptan slugs de posts que existen.

## Consecuencias

- **Más fácil:** los posts siguen siendo HTML estático; cero fricción para reaccionar; cumplir con
  privacidad es simple porque no hay datos personales.
- **Más difícil:** los números aparecen un instante después de la página.
- **Riesgo asumido:** alguien puede borrar la cookie y reaccionar de nuevo. Para retroalimentación de
  un blog es aceptable; si se vuelve un problema, se exige suscripción para reaccionar con un ADR nuevo.

## Alternativas consideradas

- **Postgres (Neon)** — rechazado: más de lo que piden unos contadores; se reconsidera si los
  comentarios crecen.
- **Solo analítica (Vercel Analytics, PostHog)** — rechazado como única fuente: da visitas, pero no
  un contador público por post ni reacciones. Puede sumarse aparte para análisis.
- **Reaccionar solo con login o suscripción** — rechazado: baja demasiado la participación.
