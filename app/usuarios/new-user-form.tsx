"use client";

import { useActionState, useState } from "react";
import { createUser, type CreateUserState } from "./actions";

const initialState: CreateUserState = {};
const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "OPERADOR", label: "Operador" },
  { value: "RIESGO", label: "Riesgo" },
  { value: "COBRANZA", label: "Cobranza" },
  { value: "CONSULTA", label: "Consulta" },
];

export default function NewUserForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createUser, initialState);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
        Nuevo usuario
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        {state.ok && state.generatedPassword ? (
          <>
            <h2 className="text-lg font-bold">Usuario creado</h2>
            <p className="mt-2 text-sm text-slate-600">
              Compartí esta contraseña temporal con <span className="font-semibold">{state.createdEmail}</span> por un canal seguro. No se vuelve a mostrar.
            </p>
            <div className="mt-4 rounded-lg border bg-slate-50 px-4 py-3 text-center font-mono text-lg tracking-wider">{state.generatedPassword}</div>
            <div className="mt-5 flex justify-end">
              <button onClick={() => setOpen(false)} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Cerrar</button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Nuevo usuario</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600" aria-label="Cerrar">✕</button>
            </div>
            <form action={formAction} className="mt-5 grid gap-4">
              <label className="text-sm font-medium">Nombre
                <input name="name" required className="mt-1 w-full rounded-lg border px-3 py-2" />
              </label>
              <label className="text-sm font-medium">Email
                <input name="email" type="email" required className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="nombre@creditospunta.uy" />
              </label>
              <label className="text-sm font-medium">Rol
                <select name="role" required defaultValue="" className="mt-1 w-full rounded-lg border px-3 py-2">
                  <option value="" disabled>Elegir rol...</option>
                  {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </label>
              {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
              <div className="mt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-50">Cancelar</button>
                <button type="submit" disabled={pending} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
                  {pending ? "Creando..." : "Crear"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
