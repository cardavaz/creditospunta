import { listClients } from "./actions";
import NewClientForm from "./new-client-form";
import { getCurrentUser } from "@/lib/auth";

function money(n: unknown) {
  const v = n === null || n === undefined ? 0 : Number(n);
  return v.toLocaleString("es-UY", { style: "currency", currency: "UYU", maximumFractionDigits: 0 });
}

const statusLabel: Record<string, string> = { ACTIVE: "Activo", INACTIVE: "Inactivo", BLOCKED: "Bloqueado" };

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const [clients, user] = await Promise.all([listClients(q), getCurrentUser()]);
  const canCreate = user && ["ADMIN", "OPERADOR"].includes(user.role);

  return (
    <main className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <div className="text-2xl font-bold">Créditos<span className="text-sky-600">Punta</span></div>
            <div className="text-xs text-slate-500">Gestión de clientes</div>
          </div>
          {canCreate && <NewClientForm />}
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-bold">Clientes</h1>
            <p className="mt-1 text-slate-500">Consulta y administración de la cartera de clientes.</p>
          </div>
          <form method="get" className="flex gap-2">
            <input
              name="q"
              defaultValue={q ?? ""}
              aria-label="Buscar cliente"
              placeholder="Buscar por nombre o CI..."
              className="rounded-lg border bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
            />
            <button type="submit" className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">Buscar</button>
          </form>
        </div>
        <section className="mt-8 overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>{["Cliente", "CI", "Ingreso mensual", "Estado", ""].map((x) => <th key={x} className="px-5 py-3 font-medium">{x}</th>)}</tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-t hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <div className="font-semibold">{c.firstName} {c.lastName}</div>
                    <div className="text-xs text-slate-400">{c.id}</div>
                  </td>
                  <td className="px-5 py-4">{c.documentNumber}</td>
                  <td className="px-5 py-4">{money(c.monthlyIncome)}</td>
                  <td className="px-5 py-4">
                    <span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + (c.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : c.status === "BLOCKED" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-700")}>
                      {statusLabel[c.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right"><span className="text-slate-300">Ficha próximamente</span></td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">No hay clientes que coincidan con la búsqueda.</td></tr>
              )}
            </tbody>
          </table>
        </section>
        <p className="mt-6 text-xs text-slate-400">Datos reales de la base de CréditosPunta (staging). No contiene información de clientes reales.</p>
      </div>
    </main>
  );
}
