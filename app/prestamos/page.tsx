import { listLoans } from "./actions";
import PaymentForm from "./payment-form";
import { overdueDays } from "@/lib/payments";

function money(n: unknown) {
  const v = n === null || n === undefined ? 0 : Number(n);
  return v.toLocaleString("es-UY", { style: "currency", currency: "UYU", maximumFractionDigits: 0 });
}

const loanStatusLabel: Record<string, string> = {
  PENDING: "Pendiente de desembolso",
  ACTIVE: "Activo",
  PAID_OFF: "Pagado",
  DEFAULTED: "Incobrable",
  CANCELLED: "Cancelado",
};

const installmentStatusLabel: Record<string, string> = { PENDING: "Pendiente", PARTIAL: "Parcial", PAID: "Pagada", OVERDUE: "Vencida" };
const installmentStatusClass: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-600",
  PARTIAL: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
  OVERDUE: "bg-red-100 text-red-800",
};

export default async function PrestamosPage() {
  const loans = await listLoans();

  return (
    <main className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <div className="text-2xl font-bold">Créditos<span className="text-sky-600">Punta</span></div>
            <div className="text-xs text-slate-500">Préstamos y cuotas</div>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="text-3xl font-bold">Préstamos</h1>
        <p className="mt-1 text-slate-500">Cuotas generadas al aprobar cada solicitud. Registrá pagos por cuota.</p>

        <div className="mt-8 space-y-6">
          {loans.map((loan) => (
            <section key={loan.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50 px-5 py-4">
                <div>
                  <div className="font-semibold">{loan.client.firstName} {loan.client.lastName} · {money(loan.principal)} en {loan.termMonths} meses</div>
                  <div className="text-xs text-slate-400">{loan.id}</div>
                </div>
                <span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + (loan.status === "PAID_OFF" ? "bg-emerald-100 text-emerald-800" : loan.status === "DEFAULTED" ? "bg-red-100 text-red-800" : "bg-sky-100 text-sky-800")}>
                  {loanStatusLabel[loan.status] ?? loan.status}
                </span>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-white text-slate-400">
                  <tr>{["#", "Vencimiento", "Importe", "Pagado", "Estado", ""].map((x) => <th key={x} className="px-5 py-2 font-medium">{x}</th>)}</tr>
                </thead>
                <tbody>
                  {loan.installments.map((i) => {
                    const days = i.status !== "PAID" ? overdueDays(i.dueDate) : 0;
                    return (
                      <tr key={i.id} className="border-t">
                        <td className="px-5 py-3">{i.number}</td>
                        <td className="px-5 py-3">{new Date(i.dueDate).toLocaleDateString("es-UY")}</td>
                        <td className="px-5 py-3">{money(i.amount)}</td>
                        <td className="px-5 py-3">{money(i.paidAmount)}</td>
                        <td className="px-5 py-3">
                          <span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + (installmentStatusClass[i.status] ?? "")}>
                            {installmentStatusLabel[i.status] ?? i.status}
                          </span>
                          {i.status !== "PAID" && days > 0 && <span className="ml-2 text-xs text-red-500">{days}d vencida</span>}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {i.status !== "PAID" && <PaymentForm installmentId={i.id} suggestedAmount={Number(i.amount) - Number(i.paidAmount)} />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          ))}
          {loans.length === 0 && (
            <div className="rounded-2xl border bg-white p-10 text-center text-slate-400 shadow-sm">
              Todavía no hay préstamos. Se generan automáticamente al aprobar una solicitud.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
