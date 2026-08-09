import { listOverdueInstallments } from "./actions";
import CollectionForm from "./collection-form";
import { overdueDays } from "@/lib/payments";
import { getCurrentUser } from "@/lib/auth";

function money(n: unknown) {
  const v = n === null || n === undefined ? 0 : Number(n);
  return v.toLocaleString("es-UY", { style: "currency", currency: "UYU", maximumFractionDigits: 0 });
}

const resultLabel: Record<string, string> = { NO_CONTACT: "Sin contacto", PROMISE_TO_PAY: "Promesa de pago", REFUSED: "Se negó", PAID: "Pagó", OTHER: "Otro" };
const channelLabel: Record<string, string> = { CALL: "Llamada", WHATSAPP: "WhatsApp", EMAIL: "Email", VISIT: "Visita", OTHER: "Otro" };

export default async function CobranzaPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const [{ items: installments, total, pageCount, totalOverdueAmount, cases }, user] = await Promise.all([
    listOverdueInstallments(page),
    getCurrentUser(),
  ]);
  const canManage = user && ["ADMIN", "COBRANZA"].includes(user.role);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="text-2xl font-bold">Créditos<span className="text-sky-600">Punta</span></div>
          <a href="/" className="text-sm font-semibold">← Dashboard</a>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-3xl font-bold">Cobranza</h1>
        <p className="mt-1 text-slate-500">Cuotas vencidas y gestiones de contacto.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5"><div className="text-sm text-slate-500">Vencido</div><div className="mt-2 text-2xl font-bold">{money(totalOverdueAmount)}</div></div>
          <div className="rounded-2xl border bg-white p-5"><div className="text-sm text-slate-500">Casos</div><div className="mt-2 text-2xl font-bold">{cases}</div></div>
          <div className="rounded-2xl border bg-white p-5"><div className="text-sm text-slate-500">Cuotas vencidas</div><div className="mt-2 text-2xl font-bold">{total}</div></div>
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>{["Préstamo", "Cliente", "Vencimiento", "Cuota", "Días mora", "Última gestión", "Acción"].map((x) => <th key={x} className="px-5 py-3 font-medium">{x}</th>)}</tr>
            </thead>
            <tbody>
              {installments.map((i) => (
                <tr key={i.id} className="border-t align-top">
                  <td className="px-5 py-4 text-xs text-slate-400">{i.loan.id.slice(0, 8)}</td>
                  <td className="px-5 py-4 font-semibold">{i.loan.client.firstName} {i.loan.client.lastName}</td>
                  <td className="px-5 py-4">{new Date(i.dueDate).toLocaleDateString("es-UY")}</td>
                  <td className="px-5 py-4">{money(Number(i.amount) - Number(i.paidAmount))}</td>
                  <td className="px-5 py-4 font-semibold text-amber-700">{overdueDays(i.dueDate)}</td>
                  <td className="px-5 py-4 text-xs text-slate-500">
                    {i.lastAction ? (
                      <>
                        {channelLabel[i.lastAction.channel]} · {resultLabel[i.lastAction.result]}
                        <div className="text-slate-400">{new Date(i.lastAction.createdAt).toLocaleDateString("es-UY")}</div>
                      </>
                    ) : "Sin gestiones"}
                  </td>
                  <td className="px-5 py-4">
                    {canManage && <CollectionForm loanId={i.loanId} installmentId={i.id} />}
                  </td>
                </tr>
              ))}
              {installments.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">No hay cuotas vencidas.</td></tr>
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
        <p className="mt-6 text-xs text-slate-400">Datos reales de staging. Las reglas definitivas de cobranza se definirán con la revisión legal (docs/OPERATING-POLICY.md).</p>
      </div>
    </main>
  );
}
