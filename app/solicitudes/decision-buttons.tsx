"use client";

import { useActionState, useState } from "react";
import { decideApplicationAction, type DecisionState } from "./actions";

const initialState: DecisionState = {};

export default function DecisionButtons({ applicationId }: { applicationId: string }) {
  const [state, formAction, pending] = useActionState(decideApplicationAction, initialState);
  const [reason, setReason] = useState("");

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <input type="hidden" name="applicationId" value={applicationId} />
      <input
        name="reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Motivo (opcional)"
        className="w-48 rounded-lg border px-2 py-1 text-xs"
      />
      <div className="flex gap-2">
        <button
          name="decision" value="REJECTED"
          disabled={pending}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
        >
          Rechazar
        </button>
        <button
          name="decision" value="APPROVED"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Aprobar y generar préstamo
        </button>
      </div>
      {state.error && <p className="text-xs font-medium text-red-600">{state.error}</p>}
    </form>
  );
}
