# 0007 — El newsletter y el correo transaccional pasan de Resend a Brevo

- **Estado:** Aceptado
- **Fecha:** 2026-10-13
- **Decide:** Alejandro Sarmiento
- **Reemplaza a:** [0004](0004-newsletter-with-resend-double-opt-in.md)

## Contexto

El ADR 0004 eligió Resend y asumió como riesgo su tope gratuito de 1.000 contactos. Alejandro tiene
una audiencia de unas 52.000 personas en Instagram, así que ese tope es probable y cercano, y el
primer plan pago de Resend para listas es de los más caros. La decisión se toma el día del primer
despliegue, cuando todavía no hay ningún suscriptor que migrar.

## Decisión

**Los contactos, los correos transaccionales y las campañas viven en Brevo. Todo lo demás del ADR
0004 se mantiene.**

- Sigue igual: formulario propio, enlace firmado que vence en 7 días, botón de confirmar, ningún
  correo guardado antes de confirmar, y el aviso de post nuevo como comando manual.
- Al confirmar, el contacto se crea en la lista `BREVO_LIST_ID`.
- La confirmación y el aviso de comentario salen por la API transaccional de Brevo.
- `pnpm run newsletter:send <slug>` crea una campaña para esa lista y la envía. El enlace de baja es
  la etiqueta `{{ unsubscribe }}` de Brevo.
- Se llama a la API HTTP de Brevo con `fetch` desde `src/lib/email.ts`, sin SDK: son tres endpoints
  y así el proveedor queda detrás de un solo archivo.
- Variables: `BREVO_API_KEY`, `BREVO_LIST_ID`, `EMAIL_FROM`. Sin ellas el comportamiento es el mismo
  de antes: simulado en desarrollo, no disponible en producción.

## Consecuencias

- **Más fácil:** la lista puede crecer sin tope de contactos en el plan gratuito, y el primer plan
  pago cuesta una fracción del de Resend. Hay editor visual y automatizaciones si algún día se
  quieren.
- **Más difícil:** el plan gratuito limita los envíos por día (300 al momento de decidir), así que
  una campaña a más suscriptores que eso exige pasar al plan pago. Los correos del plan gratuito
  llevan la marca de Brevo.
- **Riesgo asumido:** los topes y precios se tomaron de memoria y cambian; se confirman en la página
  de precios antes de depender de ellos.

## Alternativas consideradas

- **Quedarse en Resend** — rechazado: el tope de 1.000 contactos llega pronto y el salto de precio
  es mayor.
- **Usar el SDK de Brevo** — rechazado: una dependencia más para tres llamadas HTTP.
- **Formularios y doble confirmación nativos de Brevo** — rechazado: formulario con su diseño y
  menos control sobre el flujo que ya está construido y probado.
