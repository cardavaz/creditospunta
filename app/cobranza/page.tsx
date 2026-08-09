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

export default async function CobranzaPage() {
  const [installments, user] = await Promise.all([listOverdueInstallments(), getCurrentUser()]);
  const canManage = user && ["ADMIN", "COBRANZA"].includes(user.role);

  const totalOverdue = installments.reduce((s, i) => s + (Number(i.amount) - Number(i.paidAmount)), 0);
  const cases = new Set(installments.map((i) => i.loanId)).size;

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
          <div className="rounded-2xl border bg-white p-5"><div className="text-sm text-slate-500">Vencido</div><div className="mt-2 text-2xl font-bold">{money(totalOverdue)}</div></div>
          <div className="rounded-2xl border bg-white p-5"><div className="text-sm text-slate-500">Casos</div><div className="mt-2 text-2xl font-bold">{cases}</div></div>
          <div className="rounded-2xl border bg-white p-5"><div className="text-sm text-slate-500">Cuotas vencidas</div><div className="mt-2 text-2xl font-bold">{installments.length}</div></div>
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
        <p className="mt-6 text-xs text-slate-400">Datos reales de staging. Las reglas definitivas de cobranza se definirán con la revisión legal (docs/OPERATING-POLICY.md).</p>
      </div>
    </main>
  );
}
