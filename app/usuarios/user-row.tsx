"use client";

import { useActionState } from "react";
import { changeUserRole, toggleUserActive, unlockUser, type SimpleState } from "./actions";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  lockedUntil: string | null;
  createdAt: string;
};

const ROLE_OPTIONS = ["ADMIN", "OPERADOR", "RIESGO", "COBRANZA", "CONSULTA"];
const roleLabel: Record<string, string> = { ADMIN: "Admin", OPERADOR: "Operador", RIESGO: "Riesgo", COBRANZA: "Cobranza", CONSULTA: "Consulta" };

const initialState: SimpleState = {};

export default function UserRow({ user, isSelf }: { user: UserRow; isSelf: boolean }) {
  const [roleState, roleAction] = useActionState(changeUserRole, initialState);
  const [toggleState, toggleAction] = useActionState(toggleUserActive, initialState);
  const [unlockState, unlockAction] = useActionState(unlockUser, initialState);

  const isLocked = user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now();

  return (
    <tr className="border-t align-top">
      <td className="px-5 py-4">
        <div className="font-semibold">{user.name}{isSelf && <span className="ml-2 text-xs text-slate-400">(vos)</span>}</div>
        <div className="text-xs text-slate-400">{user.email}</div>
      </td>
      <td className="px-5 py-4">
        <form action={roleAction}>
          <input type="hidden" name="userId" value={user.id} />
          <select
            name="role"
            defaultValue={user.role}
            disabled={isSelf}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="rounded-lg border px-2 py-1 text-sm disabled:opacity-50"
          >
            {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{roleLabel[r]}</option>)}
          </select>
        </form>
        {roleState.error && <div className="mt-1 text-xs text-red-600">{roleState.error}</div>}
      </td>
      <td className="px-5 py-4">
        <span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + (user.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600")}>
          {user.active ? "Activo" : "Inactivo"}
        </span>
        {isLocked && (
          <div className="mt-1 text-xs font-semibold text-amber-700">
            Bloqueado hasta {new Date(user.lockedUntil as string).toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </td>
      <td className="px-5 py-4 text-right">
        <div className="flex flex-wrap justify-end gap-3">
          {isLocked && (
            <form action={unlockAction}>
              <input type="hidden" name="userId" value={user.id} />
              <button type="submit" className="font-semibold text-sky-700 hover:underline">Desbloquear</button>
            </form>
          )}
          {!isSelf && (
            <form action={toggleAction}>
              <input type="hidden" name="userId" value={user.id} />
              <button type="submit" className={"font-semibold hover:underline " + (user.active ? "text-red-600" : "text-emerald-700")}>
                {user.active ? "Desactivar" : "Activar"}
              </button>
            </form>
          )}
        </div>
        {toggleState.error && <div className="mt-1 text-xs text-red-600">{toggleState.error}</div>}
        {unlockState.error && <div className="mt-1 text-xs text-red-600">{unlockState.error}</div>}
      </td>
    </tr>
  );
}
