# 0009 — Vercel Web Analytics para saber de dónde llegan los lectores

- **Estado:** Aceptado
- **Fecha:** 2026-10-21
- **Decide:** Alejandro Sarmiento

## Contexto

El contador de visitas (ADR 0003) solo suma. Con 66 visitas no hay forma de saber si llegaron desde
Google, un LLM, Instagram o LinkedIn, y esa es justamente la pregunta que importa para decidir dónde
publicar. El ADR 0003 dejó abierta una analítica aparte "para análisis".

## Decisión

**Se agrega Vercel Web Analytics (`@vercel/analytics`, componente `<Analytics />` en el layout) y se
activa en el proyecto de Vercel.** El contador público de Redis sigue igual: uno es prueba social y
el otro es análisis privado.

- No usa cookies ni guarda datos personales; no hace falta banner de consentimiento.
- Da fuente (`referrer` y `utm_*`), país, dispositivo y páginas vistas. Para los enlaces que se
  comparten en redes se usan `utm_source` y `utm_medium` cuando el origen no manda referrer.
- Solo cuenta desde que se activa; las visitas anteriores no se pueden desglosar.

## Consecuencias

- **Más fácil:** ver qué canal trae lectores sin montar nada; consultarlo desde Vercel o con Claude.
- **Más difícil:** los números de Vercel y del contador público no van a coincidir (cuentan distinto).
- **Riesgo asumido:** el plan gratuito tiene un límite de eventos al mes. Si se acerca, se revisa.

## Alternativas consideradas

- **PostHog** — rechazado por ahora: más potente, pero usa cookies y es más de lo que pide un blog.
- **Guardar el referrer en Redis** — rechazado: sería construir una analítica propia y guardar más
  datos de lectores de los que el ADR 0003 permite.
