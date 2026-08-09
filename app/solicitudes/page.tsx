import { listApplications, listClientsForSelect, listActiveProducts } from "./actions";
import NewApplicationForm from "./new-application-form";
import DecisionButtons from "./decision-buttons";
import { getCurrentUser } from "@/lib/auth";

function money(n: unknown) {
  const v = n === null || n === undefined ? 0 : Number(n);
  return v.toLocaleString("es-UY", { style: "currency", currency: "UYU", maximumFractionDigits: 0 });
}

const statusLabel: Record<string, string> = {
  DRAFT: "Borrador",
  SUBMITTED: "Enviada",
  UNDER_REVIEW: "En revisión",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  CANCELLED: "Cancelada",
};

const statusClass: Record<string, string> = {
  UNDER_REVIEW: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-slate-100 text-slate-600",
  DRAFT: "bg-slate-100 text-slate-600",
  SUBMITTED: "bg-sky-100 text-sky-800",
};

export default async function SolicitudesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const [{ items: applications, total, pageCount }, clients, products, user] = await Promise.all([listApplications(page), listClientsForSelect(), listActiveProducts(), getCurrentUser()]);
  const canCreate = user && ["ADMIN", "OPERADOR"].includes(user.role);
  const canDecide = user && ["ADMIN", "RIESGO"].includes(user.role);

  return (
    <main className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <div className="text-2xl font-bold">Créditos<span className="text-sky-600">Punta</span></div>
            <div className="text-xs text-slate-500">Solicitudes de crédito</div>
          </div>
          {canCreate && <NewApplicationForm clients={clients} products={products} />}
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="text-3xl font-bold">Solicitudes</h1>
        <p className="mt-1 text-slate-500">Simulación, Score Punta y decisión humana antes de generar el préstamo. {total} en total.</p>

        <section className="mt-8 overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>{["Cliente", "Producto", "Monto", "Plazo", "Cuota", "Score Punta", "Riesgo", "Estado", ""].map((x) => <th key={x} className="px-5 py-3 font-medium">{x}</th>)}</tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr key={a.id} className="border-t align-top hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <div className="font-semibold">{a.client.firstName} {a.client.lastName}</div>
                    <div className="text-xs text-slate-400">{a.client.documentNumber}</div>
                  </td>
                  <td className="px-5 py-4">{a.product?.name ?? "—"}</td>
                  <td className="px-5 py-4">{money(a.requestedAmount)}</td>
                  <td className="px-5 py-4">{a.termMonths} meses</td>
                  <td className="px-5 py-4">{money(a.monthlyPayment)}</td>
                  <td className="px-5 py-4">
                    <div className="font-bold">{a.scorePunta ?? "—"}</div>
                    {a.scoreReasons.length > 0 && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs text-sky-600">Ver detalle</summary>
                        <ul className="mt-1 space-y-0.5 text-xs text-slate-500">
                          {a.scoreReasons.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </details>
                    )}
                  </td>
                  <td className="px-5 py-4">{a.riskLevel ?? "—"}</td>
                  <td className="px-5 py-4">
                    <span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + (statusClass[a.status] ?? "bg-slate-100 text-slate-600")}>
                      {statusLabel[a.status] ?? a.status}
                    </span>
                    {a.loan && <div className="mt-1 text-xs text-slate-400">Préstamo {a.loan.id.slice(0, 8)}</div>}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {a.status === "UNDER_REVIEW" && canDecide ? <DecisionButtons applicationId={a.id} /> : null}
                  </td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-slate-400">Todavía no hay solicitudes.</td></tr>
              )}
            </tbody>
          </table>
        </section>
        {pageCount > 1 && (
          <div className="mt-6 flex items-center justify-center gap-4 text-sm">
            {page > 1 ? <a href={`?page=${page - 1}`} className="rounded-lg border bg-white px-3 py-1.5 font-semibold hover:bg-slate-50">← Anterior</a> : <span className="px-3 py-1.5 text-slate-300">← Anterior</span>}
            <span className="text-slate-500">Página {page} de {pageCount}</span>
            {page < pageCount ? <a href={`?page=${page + 1}`} className="rounded-lg border bg-white px-3 py-1.5 font-semibold hover:bg-slate-50">Siguiente →</a> : <span className="px-3 py-1.5 text-slate-300">Siguiente →</span>}
          </div>
        )}
        <p className="mt-6 text-xs text-slate-400">Score Punta es una recomendación experimental. La aprobación siempre requiere una decisión humana explícita.</p>
      </div>
    </main>
  );
}
