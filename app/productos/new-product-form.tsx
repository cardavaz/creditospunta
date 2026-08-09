"use client";

import { useActionState, useEffect, useState } from "react";
import { createProduct, type ProductFormState } from "./actions";

const initialState: ProductFormState = {};

export default function NewProductForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createProduct, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
        Nuevo producto
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Nuevo producto</h2>
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600" aria-label="Cerrar">✕</button>
        </div>
        <form action={formAction} className="mt-5 grid grid-cols-2 gap-4">
          <label className="col-span-2 text-sm font-medium">Nombre
            <input name="name" required className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="Mini" />
          </label>
          <label className="text-sm font-medium">Monto mínimo
            <input name="minAmount" type="number" min="1" required className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm font-medium">Monto máximo
            <input name="maxAmount" type="number" min="1" required className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="col-span-2 text-sm font-medium">Plazos permitidos (meses, separados por coma)
            <input name="allowedTerms" required placeholder="3,6,9" className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          {state.error && <p className="col-span-2 text-sm font-medium text-red-600">{state.error}</p>}
          <div className="col-span-2 mt-2 flex justify-end gap-3">
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={pending} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
              {pending ? "Guardando..." : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
