"use client";

import { useActionState, useState } from "react";
import { createClient, type CreateClientState } from "./actions";

const initialState: CreateClientState = {};

export default function NewClientForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createClient, initialState);

  if (state.ok && open) {
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Nuevo cliente
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Nuevo cliente</h2>
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600" aria-label="Cerrar">✕</button>
        </div>
        <form action={formAction} className="mt-5 grid grid-cols-2 gap-4">
          <label className="col-span-2 text-sm font-medium">CI
            <input name="documentNumber" required className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="4.123.456-7" />
          </label>
          <label className="text-sm font-medium">Nombre
            <input name="firstName" required className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm font-medium">Apellido
            <input name="lastName" required className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm font-medium">Teléfono
            <input name="phone" className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm font-medium">Email
            <input name="email" type="email" className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm font-medium">Ingreso mensual
            <input name="monthlyIncome" type="number" min="0" step="1" className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm font-medium">Antigüedad laboral (años)
            <input name="employmentYears" type="number" min="0" step="0.5" className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          {state.error && <p className="col-span-2 text-sm font-medium text-red-600">{state.error}</p>}
          <div className="col-span-2 mt-2 flex justify-end gap-3">
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={pending} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
              {pending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
