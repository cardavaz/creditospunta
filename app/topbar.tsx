import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "./actions";

const roleLabel: Record<string, string> = {
  ADMIN: "Admin",
  OPERADOR: "Operador",
  RIESGO: "Riesgo",
  COBRANZA: "Cobranza",
  CONSULTA: "Consulta",
};

export default async function TopBar() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="border-b bg-slate-900 text-xs text-slate-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-1.5">
        <span>{user.name} · {roleLabel[user.role] ?? user.role}</span>
        <form action={logoutAction}>
          <button type="submit" className="font-semibold text-slate-200 hover:text-white">Cerrar sesión</button>
        </form>
      </div>
    </div>
  );
}
