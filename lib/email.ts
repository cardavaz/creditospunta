import "server-only";

export type SendEmailInput = { to: string; subject: string; html: string; text?: string };

const FROM = process.env.EMAIL_FROM ?? "CréditosPunta <no-reply@creditospunta.uy>";

/**
 * Envío de email vía Resend (https://resend.com) si RESEND_API_KEY está configurada
 * en el entorno. Si no hay proveedor configurado todavía -- por ejemplo en desarrollo,
 * o hasta que Dani decida y dé de alta un proveedor real -- cae a loguear el contenido
 * del email en los logs del servidor en vez de fallar. Así el flujo de reset de
 * contraseña queda completo y probado de punta a punta sin bloquear en la falta de
 * una API key; alcanza con setear RESEND_API_KEY (y opcionalmente EMAIL_FROM) en
 * Vercel para que empiece a mandar emails reales, sin tocar código.
 */
export async function sendEmail(input: SendEmailInput): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY no configurada -- no se envía email real. Para: ${input.to} | Asunto: ${input.subject}`);
    console.warn(`[email] Contenido:\n${input.text ?? input.html}`);
    return { sent: false };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: input.to, subject: input.subject, html: input.html, text: input.text }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[email] Falló el envío vía Resend (${res.status}): ${body}`);
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error("[email] Error de red enviando email", err);
    return { sent: false };
  }
}
