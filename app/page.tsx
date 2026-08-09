import { db } from "@/lib/db";
import { portfolioMetrics, type PortfolioLoan } from "@/lib/portfolio";
import type { LoanStatus } from "@/lib/workflow";

// Capital inicial del escenario modelado en docs/FINANCIAL-MODEL.md.
// No hay todavía un libro de caja real: esto es ilustrativo hasta Fase 2/5 del roadmap.
const CAPITAL_INICIAL = 300000;

function money(n: number) {
  return n.toLocaleString("es-UY", { style: "currency", currency: "UYU", maximumFractionDigits: 0 });
}

export default async function Home() {
  const loans = await db.loan.findMany({
    include: { client: true, installments: true },
    orderBy: { createdAt: "desc" },
  });

  const portfolioLoans: PortfolioLoan[] = loans.map((loan) => {
    const outstanding = loan.installments.reduce((s, i) => s + (Number(i.amount) - Number(i.paidAmount)), 0);
    const overdue = loan.installments.filter((i) => i.status === "OVERDUE").reduce((s, i) => s + (Number(i.amount) - Number(i.paidAmount)), 0);
    return { principal: Number(loan.principal), outstanding, overdue, status: loan.status as LoanStatus };
  });

  const metrics = portfolioMetrics(portfolioLoans);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const paymentsThisMonth = await db.payment.aggregate({
    _sum: { amount: true },
    where: { paidAt: { gte: startOfMonth } },
  });

  const stats: [string, string][] = [
    ["Capital disponible", money(Math.max(0, CAPITAL_INICIAL - metrics.placed))],
    ["Capital colocado", money(metrics.placed)],
    ["Cartera vigente", money(metrics.outstanding)],
    ["Cobrado este mes", money(Number(paymentsThisMonth._sum.amount ?? 0))],
    ["Mora", (metrics.delinquencyRate * 100).toLocaleString("es-UY", { maximumFractionDigits: 1 }) + "%"],
    ["Préstamos activos", String(metrics.active)],
  ];

  const recentLoans = loans.slice(0, 6);
  const loanStatusLabel: Record<string, string> = { PENDING: "Pendiente", ACTIVE: "Al día", PAID_OFF: "Pagado", DEFAULTED: "Incobrable", CANCELLED: "Cancelado" };

  return (
    <main className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <div className="text-2xl font-bold">Créditos<span className="text-sky-600">Punta</span></div>
            <div className="text-xs text-slate-500">Panel de gestión · Staging</div>
          </div>
          <a href="/solicitudes" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Nueva solicitud</a>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold">Resumen</h1>
            <p className="mt-1 text-slate-500">Vista general de la cartera (datos reales de staging).</p>
          </div>
          <a href="/clientes" className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">Ver clientes</a>
        </div>
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map(([l, v]) => (
            <div key={l} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">{l}</div>
              <div className="mt-2 text-2xl font-bold">{v}</div>
            </div>
          ))}
        </section>
        <section className="mt-8 rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-5 py-4"><h2 className="font-bold">Préstamos recientes</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>{["Préstamo", "Cliente", "Capital", "Plazo", "Cuota", "Estado"].map((x) => <th key={x} className="px-5 py-3 font-medium">{x}</th>)}</tr>
              </thead>
              <tbody>
                {recentLoans.map((l) => (
                  <tr key={l.id} className="border-t">
                    <td className="px-5 py-4 text-xs text-slate-400">{l.id.slice(0, 8)}</td>
                    <td className="px-5 py-4">{l.client.firstName} {l.client.lastName}</td>
                    <td className="px-5 py-4">{money(Number(l.principal))}</td>
                    <td className="px-5 py-4">{l.termMonths}</td>
                    <td className="px-5 py-4">{money(Number(l.monthlyPayment))}</td>
                    <td className="px-5 py-4">
                      <span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + (l.status === "PAID_OFF" ? "bg-emerald-100 text-emerald-800" : l.status === "DEFAULTED" ? "bg-red-100 text-red-800" : "bg-sky-100 text-sky-800")}>
                        {loanStatusLabel[l.status] ?? l.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentLoans.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">Todavía no hay préstamos generados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        <p className="mt-8 text-xs text-slate-400">Staging con datos ficticios. No contiene datos ni operaciones de crédito reales.</p>
      </div>
    </main>
  );
}
