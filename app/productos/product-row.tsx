"use client";

import { useActionState, useState } from "react";
import { updateProduct, type ProductFormState } from "./actions";

type Product = { id: string; name: string; minAmount: unknown; maxAmount: unknown; allowedTerms: number[]; active: boolean };

const initialState: ProductFormState = {};

function money(n: unknown) {
  return Number(n).toLocaleString("es-UY", { style: "currency", currency: "UYU", maximumFractionDigits: 0 });
}

export default function ProductRow({ product, canEdit }: { product: Product; canEdit: boolean }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(updateProduct, initialState);

  if (!editing) {
    return (
      <tr className="border-t">
        <td className="px-5 py-4 font-semibold">{product.name}</td>
        <td className="px-5 py-4">{money(product.minAmount)} – {money(product.maxAmount)}</td>
        <td className="px-5 py-4">{product.allowedTerms.join(", ")} meses</td>
        <td className="px-5 py-4">
          <span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + (product.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600")}>
            {product.active ? "Activo" : "Inactivo"}
          </span>
        </td>
        <td className="px-5 py-4 text-right">
          {canEdit && <button onClick={() => setEditing(true)} className="font-semibold text-sky-700 hover:underline">Editar</button>}
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t bg-slate-50">
      <td className="px-5 py-4 font-semibold">{product.name}</td>
      <td colSpan={4} className="px-5 py-4">
        <form action={formAction} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={product.id} />
          <label className="text-xs font-medium">Mínimo
            <input name="minAmount" type="number" min="1" defaultValue={Number(product.minAmount)} className="mt-1 w-28 rounded-lg border px-2 py-1 text-sm" />
          </label>
          <label className="text-xs font-medium">Máximo
            <input name="maxAmount" type="number" min="1" defaultValue={Number(product.maxAmount)} className="mt-1 w-28 rounded-lg border px-2 py-1 text-sm" />
          </label>
          <label className="text-xs font-medium">Plazos (meses)
            <input name="allowedTerms" defaultValue={product.allowedTerms.join(",")} className="mt-1 w-32 rounded-lg border px-2 py-1 text-sm" />
          </label>
          <label className="flex items-center gap-2 text-xs font-medium">
            <input name="active" type="checkbox" defaultChecked={product.active} />
            Activo
          </label>
          <button type="submit" disabled={pending} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
            {pending ? "..." : "Guardar"}
          </button>
          <button type="button" onClick={() => setEditing(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancelar</button>
          {state.error && <span className="w-full text-xs font-medium text-red-600">{state.error}</span>}
        </form>
      </td>
    </tr>
  );
}
