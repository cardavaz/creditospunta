"use client";

import { useActionState, useEffect, useState } from "react";
import { registerPayment, type RegisterPaymentState } from "./actions";

const initialState: RegisterPaymentState = {};

export default function PaymentForm({ installmentId, suggestedAmount }: { installmentId: string; suggestedAmount: number }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(registerPayment, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100">
        Registrar pago
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="installmentId" value={installmentId} />
      <input name="amount" type="number" min="1" step="1" defaultValue={suggestedAmount} className="w-24 rounded-lg border px-2 py-1 text-xs" />
      <select name="method" className="rounded-lg border px-2 py-1 text-xs" defaultValue="CASH">
        <option value="CASH">Efectivo</option>
        <option value="BANK_TRANSFER">Transferencia</option>
        <option value="CARD">Tarjeta</option>
        <option value="OTHER">Otro</option>
      </select>
      <input name="reference" placeholder="Referencia" className="w-28 rounded-lg border px-2 py-1 text-xs" />
      <button type="submit" disabled={pending} className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
        {pending ? "..." : "Confirmar"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancelar</button>
      {state.error && <span className="w-full text-xs font-medium text-red-600">{state.error}</span>}
    </form>
  );
}
