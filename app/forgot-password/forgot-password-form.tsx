"use client";

import { useActionState } from "react";
import { forgotPasswordAction, type ForgotPasswordState } from "./actions";

const initialState: ForgotPasswordState = {};

export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);

  if (state.sent) {
    return (
      <p className="mt-6 text-sm text-slate-600">
        Si el email está registrado, te enviamos un link para restablecer tu contraseña. Revisá tu casilla (y spam)
        -- el link vence en 1 hora.
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-6 grid gap-4">
      <label className="text-sm font-medium">Email
        <input name="email" type="email" required autoFocus className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="nombre@creditospunta.uy" />
      </label>
      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending} className="mt-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
        {pending ? "Enviando..." : "Enviar link de recuperación"}
      </button>
    </form>
  );
}
