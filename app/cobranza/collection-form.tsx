"use client";

import { useActionState, useEffect, useState } from "react";
import { registerCollectionAction, type CollectionActionState } from "./actions";

const initialState: CollectionActionState = {};

const channelLabel: Record<string, string> = { CALL: "Llamada", WHATSAPP: "WhatsApp", EMAIL: "Email", VISIT: "Visita", OTHER: "Otro" };
const resultLabel: Record<string, string> = { NO_CONTACT: "Sin contacto", PROMISE_TO_PAY: "Promesa de pago", REFUSED: "Se negó", PAID: "Pagó", OTHER: "Otro" };

export default function CollectionForm({ loanId, installmentId }: { loanId: string; installmentId: string }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState("NO_CONTACT");
  const [state, formAction, pending] = useActionState(registerCollectionAction, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100">
        Registrar gestión
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-2 flex flex-wrap items-end gap-2 rounded-lg border bg-slate-50 p-3">
      <input type="hidden" name="loanId" value={loanId} />
      <input type="hidden" name="installmentId" value={installmentId} />
      <label className="text-xs font-medium">Canal
        <select name="channel" className="mt-1 block rounded-lg border px-2 py-1 text-xs" defaultValue="CALL">
          {Object.entries(channelLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      <label className="text-xs font-medium">Resultado
        <select name="result" value={result} onChange={(e) => setResult(e.target.value)} className="mt-1 block rounded-lg border px-2 py-1 text-xs">
          {Object.entries(resultLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      {result === "PROMISE_TO_PAY" && (
        <label className="text-xs font-medium">Promete pagar el
          <input name="promiseDate" type="date" className="mt-1 block rounded-lg border px-2 py-1 text-xs" />
        </label>
      )}
      <label className="text-xs font-medium">Notas
        <input name="notes" className="mt-1 block w-40 rounded-lg border px-2 py-1 text-xs" />
      </label>
      <button type="submit" disabled={pending} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
        {pending ? "..." : "Guardar"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancelar</button>
      {state.error && <span className="w-full text-xs font-medium text-red-600">{state.error}</span>}
    </form>
  );
}
