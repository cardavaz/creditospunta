import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "./actions";

const roleLabel: Record<string, string> = {
  ADMIN: "Admin",
  OPERADOR: "Operador",
  RIESGO: "Riesgo",
  COBRANZA: "Cobranza",
  CONSULTA: "Consulta",
};

const NAV_LINKS: { href: string; label: string; roles?: string[] }[] = [
  { href: "/", label: "Dashboard" },
  { href: "/clientes", label: "Clientes" },
  { href: "/solicitudes", label: "Solicitudes" },
  { href: "/prestamos", label: "Préstamos" },
  { href: "/cobranza", label: "Cobranza" },
  { href: "/reportes", label: "Reportes" },
  { href: "/productos", label: "Productos", roles: ["ADMIN"] },
  { href: "/usuarios", label: "Usuarios", roles: ["ADMIN"] },
];

export default async function TopBar() {
  const user = await getCurrentUser();
  if (!user) return null;

  const links = NAV_LINKS.filter((l) => !l.roles || l.roles.includes(user.role));

  return (
    <div className="border-b bg-slate-900 text-slate-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-1.5 text-xs">
        <span>{user.name} · {roleLabel[user.role] ?? user.role}</span>
        <form action={logoutAction}>
          <button type="submit" className="font-semibold text-slate-200 hover:text-white">Cerrar sesión</button>
        </form>
      </div>
      <nav className="mx-auto flex max-w-7xl gap-4 overflow-x-auto px-6 pb-2 text-xs font-medium">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="whitespace-nowrap text-slate-300 hover:text-white">
            {l.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
