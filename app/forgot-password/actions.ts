"use server";

import { requestPasswordReset } from "@/lib/password-reset";
import { recordAudit } from "@/lib/audit";

export type ForgotPasswordState = { error?: string; sent?: boolean };

export async function forgotPasswordAction(_prev: ForgotPasswordState, formData: FormData): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) return { error: "Ingresá tu email." };

  await requestPasswordReset(email);
  // No revelamos si el email existe o no en la base -- misma respuesta siempre.
  await recordAudit({ action: "PASSWORD_RESET_REQUESTED", entity: "User", entityId: email, result: "OK" });

  return { sent: true };
}
