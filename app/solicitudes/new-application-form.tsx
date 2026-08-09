"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { createApplication, type CreateApplicationState } from "./actions";

type ClientOption = { id: string; firstName: string; lastName: string; documentNumber: string };
type ProductOption = { id: string; name: string; minAmount: unknown; maxAmount: unknown; allowedTerms: number[] };

const initialState: CreateApplicationState = {};

export default function NewApplicationForm({ clients, products }: { clients: ClientOption[]; products: ProductOption[] }) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [state, formAction, pending] = useActionState(createApplication, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  const selectedProduct = useMemo(() => products.find((p) => p.id === productId), [products, productId]);

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
        {products.length === 0 ? (
          <p className="mt-5 text-sm text-slate-500">No hay productos activos. Creá uno en <a href="/productos" className="font-semibold text-sky-700">Productos</a> primero.</p>
        ) : (
          <form action={formAction} className="mt-5 grid grid-cols-2 gap-4">
            <label className="col-span-2 text-sm font-medium">Cliente
              <select name="clientId" required className="mt-1 w-full rounded-lg border px-3 py-2" defaultValue="">
                <option value="" disabled>Seleccionar...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName} · {c.documentNumber}</option>
                ))}
              </select>
            </label>
            <label className="col-span-2 text-sm font-medium">Producto
              <select name="productId" required value={productId} onChange={(e) => setProductId(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2">
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (${Number(p.minAmount)}–${Number(p.maxAmount)})</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">Monto solicitado
              <input
                name="requestedAmount" type="number" required
                min={selectedProduct ? Number(selectedProduct.minAmount) : undefined}
                max={selectedProduct ? Number(selectedProduct.maxAmount) : undefined}
                className="mt-1 w-full rounded-lg border px-3 py-2"
                placeholder={selectedProduct ? `${Number(selectedProduct.minAmount)}–${Number(selectedProduct.maxAmount)}` : undefined}
              />
            </label>
            <label className="text-sm font-medium">Plazo (meses)
              <select name="termMonths" required className="mt-1 w-full rounded-lg border px-3 py-2" defaultValue="">
                <option value="" disabled>Elegir...</option>
                {selectedProduct?.allowedTerms.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="col-span-2 text-sm font-medium">Tasa nominal anual (%)
              <input name="annualRate" type="number" min="0" step="0.1" required defaultValue="60" className="mt-1 w-full rounded-lg border px-3 py-2" />
              <span className="mt-1 block text-xs text-slate-400">Tasa provisoria de simulación — todavía no validada legalmente (docs/REGULATORY-DOSSIER.md).</span>
            </label>
            {state.error && <p className="col-span-2 text-sm font-medium text-red-600">{state.error}</p>}
            <div className="col-span-2 mt-2 flex justify-end gap-3">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-50">Cancelar</button>
              <button type="submit" disabled={pending} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
                {pending ? "Calculando..." : "Simular y enviar a revisión"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
