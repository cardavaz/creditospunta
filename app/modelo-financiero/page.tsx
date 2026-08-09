import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import ScenarioSimulator from "./scenario-simulator";

function money(n: number) {
  return n.toLocaleString("es-UY", { style: "currency", currency: "UYU", maximumFractionDigits: 0 });
}

export default async function ModeloFinancieroPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const [placedAgg, active] = await Promise.all([
    db.loan.aggregate({ _sum: { principal: true } }),
    db.loan.count({ where: { status: { in: ["ACTIVE", "PENDING"] } } }),
  ]);
  const placed = Number(placedAgg._sum.principal ?? 0);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <div className="text-2xl font-bold">Créditos<span className="text-sky-600">Punta</span></div>
            <div className="text-xs text-slate-500">Modelo financiero</div>
          </div>
          <a href="/" className="text-sm font-semibold">← Dashboard</a>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Modelo financiero</h1>
          <p className="mt-1 text-slate-500">
            Simulador de escenarios de capital (Fase 5 del roadmap) -- proyección ilustrativa, no reemplaza revisión contable/legal.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Cartera real colocada hoy en staging: {money(placed)} · {active} préstamo(s) activo(s)/pendiente(s).
          </p>
        </div>
        <ScenarioSimulator />
      </div>
    </main>
  );
}
