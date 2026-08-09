import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { overdueDays } from "@/lib/payments";
import { getCurrentUser } from "@/lib/auth";

function money(n: number) {
  return n.toLocaleString("es-UY", { style: "currency", currency: "UYU", maximumFractionDigits: 0 });
}


export default async function ReportesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [loans, collectionActions] = await Promise.all([
    db.loan.findMany({
      include: { installments: true, application: { include: { product: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.collectionAction.findMany({ include: { actor: true } }),
  ]);

  // Colocación mensual: capital prestado por mes de alta del préstamo.
  const byMonth = new Map<string, { count: number; principal: number }>();
  for (const loan of loans) {
    const key = loan.createdAt.toLocaleDateString("es-UY", { year: "numeric", month: "short" });
    const cur = byMonth.get(key) ?? { count: 0, principal: 0 };
    cur.count += 1;
    cur.principal += Number(loan.principal);
    byMonth.set(key, cur);
  }
  const monthlyPlacement = Array.from(byMonth.entries()).map(([month, v]) => ({ month, ...v }));

  // Mora por producto: saldo vencido vs. saldo vigente, agrupado por producto de la solicitud origen.
  const byProduct = new Map<string, { outstanding: number; overdue: number; loanCount: number }>();
  for (const loan of loans) {
    const productName = loan.application?.product?.name ?? "Sin producto";
    const cur = byProduct.get(productName) ?? { outstanding: 0, overdue: 0, loanCount: 0 };
    cur.loanCount += 1;
    for (const i of loan.installments) {
      const balance = Number(i.amount) - Number(i.paidAmount);
      if (balance <= 0) continue;
      cur.outstanding += balance;
      if (i.status !== "PAID" && overdueDays(i.dueDate) > 0) cur.overdue += balance;
    }
    byProduct.set(productName, cur);
  }
  const productDelinquency = Array.from(byProduct.entries()).map(([product, v]) => ({
    product,
    ...v,
    rate: v.outstanding > 0 ? v.overdue / v.outstanding : 0,
  }));

  // Cobranza por gestor: cantidad de gestiones y resultado, agrupado por usuario que la registró.
  const byActor = new Map<string, { name: string; total: number; promises: number; paid: number; noContact: number; refused: number }>();
  for (const c of collectionActions) {
    const key = c.actorId ?? "sin-actor";
    const cur = byActor.get(key) ?? { name: c.actor?.name ?? "Sin asignar", total: 0, promises: 0, paid: 0, noContact: 0, refused: 0 };
    cur.total += 1;
    if (c.result === "PROMISE_TO_PAY") cur.promises += 1;
    if (c.result === "PAID") cur.paid += 1;
    if (c.result === "NO_CONTACT") cur.noContact += 1;
    if (c.result === "REFUSED") cur.refused += 1;
    byActor.set(key, cur);
  }
  const collectorStats = Array.from(byActor.values()).sort((a, b) => b.total - a.total);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <div className="text-2xl font-bold">Créditos<span className="text-sky-600">Punta</span></div>
            <div className="text-xs text-slate-500">Reportes</div>
          </div>
          <a href="/" className="text-sm font-semibold">← Dashboard</a>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-10">
        <div>
          <h1 className="text-3xl font-bold">Reportes</h1>
          <p className="mt-1 text-slate-500">Vistas agregadas de cartera, mora y cobranza sobre datos reales de staging.</p>
        </div>

        <section>
          <h2 className="text-xl font-bold">Colocación mensual</h2>
          <div className="mt-3 overflow-hidden rounded-2xl border bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>{["Mes", "Préstamos", "Capital colocado"].map((x) => <th key={x} className="px-5 py-3 font-medium">{x}</th>)}</tr>
              </thead>
              <tbody>
                {monthlyPlacement.map((m) => (
                  <tr key={m.month} className="border-t">
                    <td className="px-5 py-3 font-semibold capitalize">{m.month}</td>
                    <td className="px-5 py-3">{m.count}</td>
                    <td className="px-5 py-3">{money(m.principal)}</td>
                  </tr>
                ))}
                {monthlyPlacement.length === 0 && <tr><td colSpan={3} className="px-5 py-8 text-center text-slate-400">Sin préstamos todavía.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold">Mora por producto</h2>
          <div className="mt-3 overflow-hidden rounded-2xl border bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>{["Producto", "Préstamos", "Saldo vigente", "Saldo vencido", "Mora"].map((x) => <th key={x} className="px-5 py-3 font-medium">{x}</th>)}</tr>
              </thead>
              <tbody>
                {productDelinquency.map((p) => (
                  <tr key={p.product} className="border-t">
                    <td className="px-5 py-3 font-semibold">{p.product}</td>
                    <td className="px-5 py-3">{p.loanCount}</td>
                    <td className="px-5 py-3">{money(p.outstanding)}</td>
                    <td className="px-5 py-3">{money(p.overdue)}</td>
                    <td className="px-5 py-3">
                      <span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + (p.rate > 0.2 ? "bg-red-100 text-red-800" : p.rate > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800")}>
                        {(p.rate * 100).toLocaleString("es-UY", { maximumFractionDigits: 1 })}%
                      </span>
                    </td>
                  </tr>
                ))}
                {productDelinquency.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">Sin préstamos todavía.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold">Cobranza por gestor</h2>
          <div className="mt-3 overflow-hidden rounded-2xl border bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>{["Gestor", "Gestiones", "Promesas de pago", "Pagó", "Sin contacto", "Se negó"].map((x) => <th key={x} className="px-5 py-3 font-medium">{x}</th>)}</tr>
              </thead>
              <tbody>
                {collectorStats.map((c) => (
                  <tr key={c.name} className="border-t">
                    <td className="px-5 py-3 font-semibold">{c.name}</td>
                    <td className="px-5 py-3">{c.total}</td>
                    <td className="px-5 py-3">{c.promises}</td>
                    <td className="px-5 py-3">{c.paid}</td>
                    <td className="px-5 py-3">{c.noContact}</td>
                    <td className="px-5 py-3">{c.refused}</td>
                  </tr>
                ))}
                {collectorStats.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">Sin gestiones registradas.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <p className="text-xs text-slate-400">Datos reales de staging. No contiene información de clientes reales. Los umbrales de mora mostrados son ilustrativos hasta la revisión legal/financiera (docs/FINANCIAL-MODEL.md).</p>
      </div>
    </main>
  );
}
