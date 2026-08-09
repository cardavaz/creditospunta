import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientDetail } from "../actions";

function money(n: unknown) {
  const v = n === null || n === undefined ? 0 : Number(n);
  return v.toLocaleString("es-UY", { style: "currency", currency: "UYU", maximumFractionDigits: 0 });
}

const clientStatusLabel: Record<string, string> = { ACTIVE: "Activo", INACTIVE: "Inactivo", BLOCKED: "Bloqueado" };
const applicationStatusLabel: Record<string, string> = {
  DRAFT: "Borrador", SUBMITTED: "Enviada", UNDER_REVIEW: "En revisión", APPROVED: "Aprobada", REJECTED: "Rechazada", CANCELLED: "Cancelada",
};
const loanStatusLabel: Record<string, string> = {
  PENDING: "Pendiente de desembolso", ACTIVE: "Activo", PAID_OFF: "Pagado", DEFAULTED: "Incobrable", CANCELLED: "Cancelado",
};
const installmentStatusLabel: Record<string, string> = { PENDING: "Pendiente", PARTIAL: "Parcial", PAID: "Pagada", OVERDUE: "Vencida" };
const installmentStatusClass: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-600",
  PARTIAL: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
  OVERDUE: "bg-red-100 text-red-800",
};
const channelLabel: Record<string, string> = { CALL: "Llamada", WHATSAPP: "WhatsApp", EMAIL: "Email", VISIT: "Visita", OTHER: "Otro" };
const resultLabel: Record<string, string> = { NO_CONTACT: "Sin contacto", PROMISE_TO_PAY: "Promesa de pago", REFUSED: "Se negó", PAID: "Pagó", OTHER: "Otro" };

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClientDetail(id);
  if (!client) notFound();

  const totalLoaned = client.loans.reduce((s, l) => s + Number(l.principal), 0);
  const activeLoans = client.loans.filter((l) => l.status === "ACTIVE").length;
  const allCollectionActions = client.loans
    .flatMap((l) => l.collectionActions.map((c) => ({ ...c, loanId: l.id })))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <div className="text-2xl font-bold">Créditos<span className="text-sky-600">Punta</span></div>
            <div className="text-xs text-slate-500">Ficha de cliente</div>
          </div>
          <Link href="/clientes" className="text-sm font-semibold">← Clientes</Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{client.firstName} {client.lastName}</h1>
            <p className="mt-1 text-slate-500">CI {client.documentNumber}</p>
          </div>
          <span className={"rounded-full px-3 py-1 text-xs font-semibold " + (client.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : client.status === "BLOCKED" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-700")}>
            {clientStatusLabel[client.status] ?? client.status}
          </span>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border bg-white p-5"><div className="text-sm text-slate-500">Ingreso mensual</div><div className="mt-2 text-xl font-bold">{money(client.monthlyIncome)}</div></div>
          <div className="rounded-2xl border bg-white p-5"><div className="text-sm text-slate-500">Antigüedad laboral</div><div className="mt-2 text-xl font-bold">{client.employmentYears ? `${Number(client.employmentYears)} años` : "—"}</div></div>
          <div className="rounded-2xl border bg-white p-5"><div className="text-sm text-slate-500">Total prestado</div><div className="mt-2 text-xl font-bold">{money(totalLoaned)}</div></div>
          <div className="rounded-2xl border bg-white p-5"><div className="text-sm text-slate-500">Préstamos activos</div><div className="mt-2 text-xl font-bold">{activeLoans}</div></div>
        </section>

        <section className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-500">Contacto</h2>
          <dl className="mt-3 grid gap-3 text-sm md:grid-cols-3">
            <div><dt className="text-slate-400">Teléfono</dt><dd className="font-medium">{client.phone ?? "—"}</dd></div>
            <div><dt className="text-slate-400">Email</dt><dd className="font-medium">{client.email ?? "—"}</dd></div>
            <div><dt className="text-slate-400">Dirección</dt><dd className="font-medium">{client.address ?? "—"}</dd></div>
          </dl>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold">Solicitudes</h2>
          <div className="mt-3 overflow-hidden rounded-2xl border bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>{["Fecha", "Producto", "Monto", "Score Punta", "Estado"].map((x) => <th key={x} className="px-5 py-3 font-medium">{x}</th>)}</tr>
              </thead>
              <tbody>
                {client.applications.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="px-5 py-3">{new Date(a.createdAt).toLocaleDateString("es-UY")}</td>
                    <td className="px-5 py-3">{a.product?.name ?? "—"}</td>
                    <td className="px-5 py-3">{money(a.requestedAmount)}</td>
                    <td className="px-5 py-3">{a.scorePunta ?? "—"} {a.riskLevel ? `(${a.riskLevel})` : ""}</td>
                    <td className="px-5 py-3">{applicationStatusLabel[a.status] ?? a.status}</td>
                  </tr>
                ))}
                {client.applications.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">Sin solicitudes todavía.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 space-y-6">
          <h2 className="text-xl font-bold">Préstamos y cuotas</h2>
          {client.loans.map((loan) => (
            <div key={loan.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50 px-5 py-4">
                <div>
                  <div className="font-semibold">{money(loan.principal)} en {loan.termMonths} meses</div>
                  <div className="text-xs text-slate-400">{loan.id}</div>
                </div>
                <span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + (loan.status === "PAID_OFF" ? "bg-emerald-100 text-emerald-800" : loan.status === "DEFAULTED" ? "bg-red-100 text-red-800" : "bg-sky-100 text-sky-800")}>
                  {loanStatusLabel[loan.status] ?? loan.status}
                </span>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-white text-slate-400">
                  <tr>{["#", "Vencimiento", "Importe", "Pagado", "Estado"].map((x) => <th key={x} className="px-5 py-2 font-medium">{x}</th>)}</tr>
                </thead>
                <tbody>
                  {loan.installments.map((i) => (
                    <tr key={i.id} className="border-t">
                      <td className="px-5 py-3">{i.number}</td>
                      <td className="px-5 py-3">{new Date(i.dueDate).toLocaleDateString("es-UY")}</td>
                      <td className="px-5 py-3">{money(i.amount)}</td>
                      <td className="px-5 py-3">{money(i.paidAmount)}</td>
                      <td className="px-5 py-3">
                        <span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + (installmentStatusClass[i.status] ?? "")}>
                          {installmentStatusLabel[i.status] ?? i.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {client.loans.length === 0 && (
            <div className="rounded-2xl border bg-white p-8 text-center text-slate-400 shadow-sm">Sin préstamos todavía.</div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold">Gestiones de cobranza</h2>
          <div className="mt-3 overflow-hidden rounded-2xl border bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>{["Fecha", "Canal", "Resultado", "Gestor", "Notas"].map((x) => <th key={x} className="px-5 py-3 font-medium">{x}</th>)}</tr>
              </thead>
              <tbody>
                {allCollectionActions.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="px-5 py-3">{new Date(c.createdAt).toLocaleDateString("es-UY")}</td>
                    <td className="px-5 py-3">{channelLabel[c.channel] ?? c.channel}</td>
                    <td className="px-5 py-3">{resultLabel[c.result] ?? c.result}</td>
                    <td className="px-5 py-3">{c.actor?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-500">{c.notes ?? "—"}</td>
                  </tr>
                ))}
                {allCollectionActions.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">Sin gestiones registradas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-6 text-xs text-slate-400">Datos reales de staging. No contiene información de clientes reales.</p>
      </div>
    </main>
  );
}
