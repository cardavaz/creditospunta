"use server";

import { resetPassword } from "@/lib/password-reset";
import { recordAudit } from "@/lib/audit";

const MIN_PASSWORD_LENGTH = 8;

export type ResetPasswordState = { error?: string; ok?: boolean };

export async function resetPasswordAction(_prev: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!token) return { error: "Link inválido." };
  if (password.length < MIN_PASSWORD_LENGTH) return { error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` };
  if (password !== confirmPassword) return { error: "Las contraseñas no coinciden." };

  const result = await resetPassword(token, password);
  await recordAudit({
    action: "PASSWORD_RESET_COMPLETED",
    entity: "User",
    entityId: "token:" + token.slice(0, 8),
    result: result.ok ? "OK" : "DENIED",
    reason: result.ok ? undefined : result.reason === "expired" ? "Token vencido" : "Token inválido o ya usado",
  });

  if (!result.ok) {
    return { error: result.reason === "expired" ? "El link venció. Pedí uno nuevo." : "El link es inválido o ya fue usado." };
  }
  return { ok: true };
}
