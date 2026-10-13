import { Resend } from "resend";
import { env, hasEmail } from "./env";
import { author, site, SITE_URL } from "./site";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(body: string): string {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#faf8f5;font-family:Georgia,'Times New Roman',serif;color:#1c1917">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
<p style="font-family:Helvetica,Arial,sans-serif;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#78716c;margin:0 0 28px">${escapeHtml(site.name)}</p>
${body}
<p style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#78716c;margin:40px 0 0;border-top:1px solid #e7e5e4;padding-top:20px">${escapeHtml(author.name)} · <a href="${SITE_URL}" style="color:#78716c">alejosarmiento.com</a></p>
</div></body></html>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:28px 0"><a href="${href}" style="display:inline-block;background:#1c1917;color:#faf8f5;text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;padding:12px 22px;border-radius:999px">${escapeHtml(label)}</a></p>`;
}

export function confirmationEmail(confirmUrl: string) {
  return {
    subject: "Confirma tu suscripción al blog de Alejandro Sarmiento",
    html: layout(
      `<h1 style="font-size:26px;line-height:1.25;margin:0 0 16px">Un clic y quedas dentro</h1>
<p style="font-size:17px;line-height:1.6;margin:0">Confirma tu correo para recibir cada post nuevo sobre IA aplicada y software para empresas. Sin spam, y te puedes dar de baja cuando quieras.</p>
${button(confirmUrl, "Confirmar suscripción")}
<p style="font-size:14px;line-height:1.6;color:#78716c;margin:0">Si no fuiste tú, ignora este correo y no pasa nada.</p>`,
    ),
  };
}

export function newPostEmail(post: { title: string; description: string; url: string }) {
  return {
    subject: post.title,
    html: layout(
      `<p style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#78716c;margin:0 0 8px">Nuevo en el blog</p>
<h1 style="font-size:28px;line-height:1.2;margin:0 0 16px">${escapeHtml(post.title)}</h1>
<p style="font-size:17px;line-height:1.6;margin:0">${escapeHtml(post.description)}</p>
${button(post.url, "Leer el post")}
<p style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#78716c;margin:0"><a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#78716c">Darme de baja</a></p>`,
    ),
  };
}

export function commentNotificationEmail(input: {
  postTitle: string;
  name: string;
  body: string;
  moderateUrl: string;
}) {
  return {
    subject: `Comentario nuevo de ${input.name} en "${input.postTitle}"`,
    html: layout(
      `<h1 style="font-size:22px;line-height:1.3;margin:0 0 6px">Comentario por moderar</h1>
<p style="font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#78716c;margin:0 0 20px">${escapeHtml(input.name)} en «${escapeHtml(input.postTitle)}»</p>
<blockquote style="margin:0;padding:0 0 0 16px;border-left:3px solid #d6d3d1;font-size:17px;line-height:1.6;white-space:pre-wrap">${escapeHtml(input.body)}</blockquote>
${button(input.moderateUrl, "Aprobar o eliminar")}`,
    ),
  };
}

function client(): Resend {
  return new Resend(env.resendApiKey);
}

export async function sendEmail(message: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!hasEmail) return false;
  const { error } = await client().emails.send({
    from: env.emailFrom!,
    to: message.to,
    subject: message.subject,
    html: message.html,
  });
  if (error) {
    console.error(`[email] envío fallido: ${error.name}`);
    return false;
  }
  return true;
}

// Idempotent from the reader's point of view: confirming twice is not an error.
export async function addSubscriber(email: string): Promise<boolean> {
  if (!hasEmail) return false;
  const { error } = await client().contacts.create({
    email,
    unsubscribed: false,
    ...(env.resendSegmentId ? { segments: [{ id: env.resendSegmentId }] } : {}),
  });
  if (error && !/already exists/i.test(error.message)) {
    console.error(`[email] no se pudo crear el contacto: ${error.name}`);
    return false;
  }
  return true;
}
