import { listApplications, listClientsForSelect } from "./actions";
import NewApplicationForm from "./new-application-form";
import DecisionButtons from "./decision-buttons";

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

export default async function SolicitudesPage() {
  const [applications, clients] = await Promise.all([listApplications(), listClientsForSelect()]);

  return (
    <main className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <div className="text-2xl font-bold">Créditos<span className="text-sky-600">Punta</span></div>
            <div className="text-xs text-slate-500">Solicitudes de crédito</div>
          </div>
          <NewApplicationForm clients={clients} />
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="text-3xl font-bold">Solicitudes</h1>
        <p className="mt-1 text-slate-500">Simulación, Score Punta y decisión humana antes de generar el préstamo.</p>

        <section className="mt-8 overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>{["Cliente", "Monto", "Plazo", "Cuota", "Score Punta", "Riesgo", "Estado", ""].map((x) => <th key={x} className="px-5 py-3 font-medium">{x}</th>)}</tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr key={a.id} className="border-t align-top hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <div className="font-semibold">{a.client.firstName} {a.client.lastName}</div>
                    <div className="text-xs text-slate-400">{a.client.documentNumber}</div>
                  </td>
                  <td className="px-5 py-4">{money(a.requestedAmount)}</td>
                  <td className="px-5 py-4">{a.termMonths} meses</td>
                  <td className="px-5 py-4">{money(a.monthlyPayment)}</td>
                  <td className="px-5 py-4 font-bold">{a.scorePunta ?? "—"}</td>
                  <td className="px-5 py-4">{a.riskLevel ?? "—"}</td>
                  <td className="px-5 py-4">
                    <span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + (statusClass[a.status] ?? "bg-slate-100 text-slate-600")}>
                      {statusLabel[a.status] ?? a.status}
                    </span>
                    {a.loan && <div className="mt-1 text-xs text-slate-400">Préstamo {a.loan.id.slice(0, 8)}</div>}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {a.status === "UNDER_REVIEW" ? <DecisionButtons applicationId={a.id} /> : null}
                  </td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400">Todavía no hay solicitudes.</td></tr>
              )}
            </tbody>
          </table>
        </section>
        <p className="mt-6 text-xs text-slate-400">Score Punta es una recomendación experimental. La aprobación siempre requiere una decisión humana explícita.</p>
      </div>
    </main>
  );
}
