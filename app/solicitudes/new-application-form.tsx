"use client";

import { useActionState, useEffect, useState } from "react";
import { createApplication, type CreateApplicationState } from "./actions";

type ClientOption = { id: string; firstName: string; lastName: string; documentNumber: string };

const initialState: CreateApplicationState = {};

export default function NewApplicationForm({ clients }: { clients: ClientOption[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createApplication, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
        Nueva solicitud
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Nueva solicitud</h2>
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600" aria-label="Cerrar">✕</button>
        </div>
        <form action={formAction} className="mt-5 grid grid-cols-2 gap-4">
          <label className="col-span-2 text-sm font-medium">Cliente
            <select name="clientId" required className="mt-1 w-full rounded-lg border px-3 py-2" defaultValue="">
              <option value="" disabled>Seleccionar...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName} · {c.documentNumber}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">Monto solicitado
            <input name="requestedAmount" type="number" min="1" step="1" required className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="8000" />
          </label>
          <label className="text-sm font-medium">Plazo (meses)
            <select name="termMonths" required className="mt-1 w-full rounded-lg border px-3 py-2" defaultValue="6">
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="6">6</option>
              <option value="9">9</option>
              <option value="12">12</option>
            </select>
          </label>
          <label className="col-span-2 text-sm font-medium">Tasa nominal anual (%)
            <input name="annualRate" type="number" min="0" step="0.1" required defaultValue="60" className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          {state.error && <p className="col-span-2 text-sm font-medium text-red-600">{state.error}</p>}
          <div className="col-span-2 mt-2 flex justify-end gap-3">
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={pending} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
              {pending ? "Calculando..." : "Simular y enviar a revisión"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
