"use server";

import { redirect } from "next/navigation";
import { login } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) return { error: "Ingresá email y contraseña." };

  const ok = await login(email, password);
  await recordAudit({
    action: "LOGIN",
    entity: "User",
    entityId: email,
    result: ok ? "OK" : "DENIED",
    reason: ok ? undefined : "Credenciales inválidas",
  });

  if (!ok) return { error: "Email o contraseña incorrectos." };
  redirect("/");
}
