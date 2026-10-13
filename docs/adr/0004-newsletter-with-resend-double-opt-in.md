# 0004 — Newsletter propio con Resend y doble confirmación

- **Estado:** Aceptado
- **Fecha:** 2026-10-10
- **Decide:** Alejandro Sarmiento

## Contexto

El blog quiere suscriptores para avisarles cada vez que sale un post. La lista es el activo: debe
ser de Alejandro y poder exportarse. En Colombia (Ley 1581) y en cualquier práctica sana de correo,
se necesita consentimiento demostrable y una baja con un clic.

## Decisión

**La suscripción es un formulario propio; los contactos y los envíos viven en Resend. Nadie entra a
la lista sin confirmar desde su correo.**

- El formulario llama a `/api/subscribe`, que envía un correo con un enlace firmado (HMAC, vence en
  7 días). El enlace abre `/newsletter/confirmar`, donde un botón confirma y crea el contacto en el
  segmento de Resend. El paso del botón evita que los antivirus de correo, que visitan los enlaces
  por su cuenta, confirmen por la persona.
- No se guarda el correo en ninguna base propia antes de confirmar: el token lo lleva firmado.
- **Aviso de post nuevo:** `pnpm run newsletter:send <slug>` crea y envía un Broadcast de Resend con
  el título, el resumen y el enlace. Es un comando manual, a propósito: un deploy no debe mandar
  correos por accidente. Resend agrega el enlace de baja.
- Sin `RESEND_API_KEY`, en desarrollo el enlace de confirmación se imprime en consola; en producción
  el formulario responde que no está disponible.

## Consecuencias

- **Más fácil:** diseño de correo propio, lista exportable, gratis hasta 1.000 contactos y 3.000
  correos al mes.
- **Más difícil:** hay que verificar el dominio en Resend (registros DNS en Hostinger) y acordarse de
  correr el comando al publicar.
- **Riesgo asumido:** al pasar de 1.000 suscriptores Resend cobra. Es un buen problema; ahí se evalúa
  el plan pago frente a migrar la lista.

## Alternativas consideradas

- **Buttondown** — rechazado: gratis solo hasta 100 suscriptores.
- **beehiiv embebido** — rechazado: formulario y correos con su marca, y los posts habría que
  escribirlos dos veces.
- **Enviar automáticamente en cada deploy** — rechazado: difícil saber qué post es "nuevo" sin
  estado, y un error envía correos que no se pueden recoger.
