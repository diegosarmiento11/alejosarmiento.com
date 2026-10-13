# 0006 — Flujo de trabajo liviano: ADR, docs y CLAUDE.md, sin tablero ni trunk-based

- **Estado:** Aceptado
- **Fecha:** 2026-10-10
- **Decide:** Alejandro Sarmiento

## Contexto

La forma de trabajar de este repo se tomó de `forabi-health`, que tiene un acuerdo de entrega
completo: desarrollo basado en trunk con ramas de horas, feature flags, entrega progresiva, tablero
Delivery operado por MCP, hooks de git y una red de pruebas por tipo de cambio. Eso responde a un
equipo de varias personas construyendo un SaaS multi-tenant con datos de salud.

Este es un blog personal mantenido por una persona. Un error se corrige con otro deploy y Vercel
permite volver a la versión anterior con un clic.

## Decisión

**Se adopta de forabi-health lo que hace que el código se construya con criterio, y se deja fuera lo
que coordina a un equipo.**

Se adopta:

- `CLAUDE.md` como resumen de reglas, corto, que enlaza al detalle.
- ADRs para toda decisión de stack, servicio externo o datos de lectores, con el mismo formato.
- `docs/plan.md` con el diseño, las decisiones cerradas y lo que queda fuera.
- Un solo comando, `pnpm run verify`, como contrato de "está listo".
- Tests al lado del archivo, obligatorios para la lógica; bug con test de regresión.
- `process.env` en un solo archivo y el sitio arrancando sin credenciales.
- Nunca `git push` sin confirmación; nunca debilitar un check; nunca declarar verde sin correrlo.
- Código en inglés, documentación en español.

Se deja fuera:

- Trunk-based con límites de vida y tamaño de rama, feature flags y entrega progresiva.
- El tablero Delivery y el servidor MCP `boards`.
- Hooks de git, dependency-cruiser, tests de arquitectura y puertas de cobertura.
- Pipeline de CI propio: Vercel compila cada rama y `verify` se corre en local.

## Consecuencias

- **Más fácil:** publicar un post o un ajuste toma minutos y no hay ceremonia que mantener.
- **Más difícil:** nada impide mezclar algo roto si no se corre `verify`; depende de la disciplina.
- **Riesgo asumido:** si entra un segundo colaborador o el blog empieza a manejar pagos o datos
  sensibles, este ADR se reemplaza y se agregan CI y revisión obligatoria.

## Alternativas consideradas

- **Copiar el acuerdo de entrega completo** — rechazado: el costo de la ceremonia supera el riesgo
  que cubre en un blog.
- **Ninguna estructura** — rechazado: sin ADRs ni `CLAUDE.md`, cada sesión con Claude Code vuelve a
  decidir lo mismo y el SEO pierde consistencia entre posts.
