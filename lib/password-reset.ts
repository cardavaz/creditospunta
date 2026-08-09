import "server-only";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { sendEmail } from "./email";

const TOKEN_BYTES = 32;
const EXPIRY_MINUTES = 60;
const RESEND_COOLDOWN_MINUTES = 2;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function appUrl() {
  return process.env.APP_URL ?? "http://localhost:3000";
}

/**
 * Genera un token de un solo uso (expira en 1h) y dispara el email con el link de
 * reseteo. Siempre responde igual exista o no el email en la base -- no hay que
 * filtrar qué emails están registrados en el sistema. También aplica un cooldown
 * por usuario (no por IP -- no tenemos esa capa acá) para que no se pueda
 * bombardear la casilla de una misma cuenta pidiendo resets en loop; como la
 * respuesta al llamador es siempre la misma, el cooldown tampoco filtra nada.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !user.active) return;

  const recentToken = await db.passwordResetToken.findFirst({
    where: { userId: user.id, createdAt: { gte: new Date(Date.now() - RESEND_COOLDOWN_MINUTES * 60_000) } },
    orderBy: { createdAt: "desc" },
  });
  if (recentToken) return;

  const rawToken = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60_000);

  await db.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });

  const link = `${appUrl()}/reset-password?token=${rawToken}`;
  await sendEmail({
    to: user.email,
    subject: "Restablecer contraseña · CréditosPunta",
    html: `<p>Hola ${user.name},</p><p>Recibimos un pedido para restablecer tu contraseña de CréditosPunta. Este link vence en ${EXPIRY_MINUTES} minutos:</p><p><a href="${link}">${link}</a></p><p>Si no fuiste vos, ignorá este email -- tu contraseña sigue siendo la misma.</p>`,
    text: `Restablecé tu contraseña en: ${link} (vence en ${EXPIRY_MINUTES} minutos). Si no fuiste vos, ignorá este email.`,
  });
}

export type ResetPasswordResult = { ok: true } | { ok: false; reason: "invalid" | "expired" };

/** Consume el token (si es válido) y setea la nueva contraseña. Un token solo sirve una vez. */
export async function resetPassword(rawToken: string, newPassword: string): Promise<ResetPasswordResult> {
  const tokenHash = hashToken(rawToken);
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.usedAt) return { ok: false, reason: "invalid" };
  if (record.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  return { ok: true };
}
