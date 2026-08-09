"use client";

import { useActionState } from "react";
import { resetPasswordAction, type ResetPasswordState } from "./actions";

const initialState: ResetPasswordState = {};

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);

  if (state.ok) {
    return (
      <p className="mt-6 text-sm text-slate-600">
        Listo, tu contraseña se actualizó. <a href="/login" className="font-semibold text-sky-600 hover:underline">Iniciar sesión</a>
      </p>
    );
  }

  if (!token) {
    return <p className="mt-6 text-sm font-medium text-red-600">Link inválido. Pedí uno nuevo desde <a href="/forgot-password" className="underline">recuperar contraseña</a>.</p>;
  }

  return (
    <form action={formAction} className="mt-6 grid gap-4">
      <input type="hidden" name="token" value={token} />
      <label className="text-sm font-medium">Nueva contraseña
        <input name="password" type="password" required minLength={8} autoFocus className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <label className="text-sm font-medium">Confirmar contraseña
        <input name="confirmPassword" type="password" required minLength={8} className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending} className="mt-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
        {pending ? "Guardando..." : "Guardar nueva contraseña"}
      </button>
    </form>
  );
}
