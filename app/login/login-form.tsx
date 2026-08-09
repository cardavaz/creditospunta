"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-6 grid gap-4">
      <label className="text-sm font-medium">Email
        <input name="email" type="email" required autoFocus className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="nombre@creditospunta.uy" />
      </label>
      <label className="text-sm font-medium">Contraseña
        <input name="password" type="password" required className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending} className="mt-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
        {pending ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
