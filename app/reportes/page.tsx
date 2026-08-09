import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

function money(n: number) {
  return n.toLocaleString("es-UY", { style: "currency", currency: "UYU", maximumFractionDigits: 0 });
}

type MonthlyRow = { month_key: string; count: number; principal: number };
type ProductRow = { product: string; loan_count: number; outstanding: number; overdue: number };

export default async function ReportesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Todo agregado a nivel de base (groupBy / $queryRaw) en vez de traer todos los
  // préstamos/cuotas/gestiones a memoria -- esto es lo que se rompía bajo carga (Fase 4).
  const [monthlyRows, productRows, collectionGroups] = await Promise.all([
    // Colocación mensual: capital prestado por mes de alta del préstamo.
    db.$queryRaw<MonthlyRow[]>`
      SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') as month_key,
             COUNT(*)::int as count,
             COALESCE(SUM(principal), 0)::float8 as principal
      FROM "Loan"
      GROUP BY 1
      ORDER BY 1
    `,
    // Mora por producto: saldo vencido vs. saldo vigente, agrupado por producto de la solicitud origen.
    // "Vencido" en vivo por fecha (dueDate < ahora && status != PAID), igual que en el dashboard.
    db.$queryRaw<ProductRow[]>`
      SELECT
        COALESCE(p.name, 'Sin producto') as product,
        COUNT(DISTINCT l.id)::int as loan_count,
        COALESCE(SUM(GREATEST(i.amount - i."paidAmount", 0)), 0)::float8 as outstanding,
        COALESCE(SUM(CASE WHEN i.status <> 'PAID' AND i."dueDate" < NOW() THEN GREATEST(i.amount - i."paidAmount", 0) ELSE 0 END), 0)::float8 as overdue
      FROM "Loan" l
      LEFT JOIN "LoanApplication" a ON a.id = l."applicationId"
      LEFT JOIN "Product" p ON p.id = a."productId"
      LEFT JOIN "Installment" i ON i."loanId" = l.id
      GROUP BY COALESCE(p.name, 'Sin producto')
      ORDER BY 1
    `,
    // Cobranza por gestor: cantidad de gestiones y resultado, agrupado por usuario que la registró.
    db.collectionAction.groupBy({ by: ["actorId", "result"], _count: { _all: true } }),
  ]);

  const monthlyPlacement = monthlyRows.map((r) => ({
    month: new Date(`${r.month_key}-01T00:00:00`).toLocaleDateString("es-UY", { year: "numeric", month: "short" }),
    count: r.count,
    principal: r.principal,
  }));

  const productDelinquency = productRows.map((r) => ({
    product: r.product,
    loanCount: r.loan_count,
    outstanding: r.outstanding,
    overdue: r.overdue,
    rate: r.outstanding > 0 ? r.overdue / r.outstanding : 0,
  }));

  const actorIds = Array.from(new Set(collectionGroups.map((g) => g.actorId).filter((id): id is string => !!id)));
  const actors = actorIds.length
    ? await db.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true } })
    : [];
  const actorNames = new Map<string, string>(actors.map((a) => [a.id, a.name]));

  const byActor = new Map<string, { name: string; total: number; promises: number; paid: number; noContact: number; refused: number }>();
  for (const g of collectionGroups) {
    const key = g.actorId ?? "sin-actor";
    const cur = byActor.get(key) ?? { name: g.actorId ? actorNames.get(g.actorId) ?? "Sin asignar" : "Sin asignar", total: 0, promises: 0, paid: 0, noContact: 0, refused: 0 };
    cur.total += g._count._all;
    if (g.result === "PROMISE_TO_PAY") cur.promises += g._count._all;
    if (g.result === "PAID") cur.paid += g._count._all;
    if (g.result === "NO_CONTACT") cur.noContact += g._count._all;
    if (g.result === "REFUSED") cur.refused += g._count._all;
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
