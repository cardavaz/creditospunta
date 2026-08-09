"use server";

import { redirect } from "next/navigation";
import { login } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) return { error: "Ingresá email y contraseña." };

  const result = await login(email, password);
  await recordAudit({
    action: "LOGIN",
    entity: "User",
    entityId: email,
    result: result.ok ? "OK" : "DENIED",
    reason: result.ok ? undefined : result.reason === "locked" ? "Cuenta bloqueada por intentos fallidos" : "Credenciales inválidas",
  });

  if (!result.ok) {
    if (result.reason === "locked") {
      const minutes = Math.max(1, Math.ceil((result.lockedUntil.getTime() - Date.now()) / 60_000));
      return { error: `Cuenta bloqueada por demasiados intentos fallidos. Probá de nuevo en ${minutes} minuto${minutes === 1 ? "" : "s"}.` };
    }
    return { error: "Email o contraseña incorrectos." };
  }
  redirect("/");
}
