"use client";

import { useMemo, useState } from "react";
import { DEFAULT_SCENARIO, simulateScenario, type ScenarioParams } from "@/lib/financial-model";

function money(n: number) {
  return n.toLocaleString("es-UY", { style: "currency", currency: "UYU", maximumFractionDigits: 0 });
}

function pct(n: number) {
  return (n * 100).toLocaleString("es-UY", { maximumFractionDigits: 1 });
}

const FIELDS: { key: keyof ScenarioParams; label: string; suffix?: string; step: number; toInput: (v: number) => number; fromInput: (v: number) => number }[] = [
  { key: "capitalInicial", label: "Capital inicial a prestar", step: 10000, toInput: (v) => v, fromInput: (v) => v },
  { key: "montoPromedio", label: "Monto promedio por préstamo", step: 500, toInput: (v) => v, fromInput: (v) => v },
  { key: "tasaMensual", label: "Tasa mensual (simulación)", suffix: "%", step: 0.5, toInput: (v) => v * 100, fromInput: (v) => v / 100 },
  { key: "plazoMeses", label: "Plazo (meses)", step: 1, toInput: (v) => v, fromInput: (v) => v },
  { key: "tasaIncobrabilidad", label: "Incobrabilidad esperada", suffix: "%", step: 0.5, toInput: (v) => v * 100, fromInput: (v) => v / 100 },
  { key: "horizonMeses", label: "Horizonte de proyección (meses)", step: 6, toInput: (v) => v, fromInput: (v) => v },
];

export default function ScenarioSimulator() {
  const [params, setParams] = useState<ScenarioParams>(DEFAULT_SCENARIO);

  const months = useMemo(() => {
    try {
      return simulateScenario(params);
    } catch {
      return [];
    }
  }, [params]);

  const last = months[months.length - 1];
  const totalInteres = months.reduce((s, m) => s + m.interesGanado, 0);
  const totalPerdida = months.reduce((s, m) => s + m.perdidaEsperada, 0);
  const multiplo = last && params.capitalInicial > 0 ? last.capitalTotal / params.capitalInicial : 0;
  const maxCapital = months.reduce((m, x) => Math.max(m, x.capitalTotal), params.capitalInicial || 1);

  function update(key: keyof ScenarioParams, raw: number) {
    if (Number.isNaN(raw)) return;
    setParams((prev) => ({ ...prev, [key]: raw }));
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="font-bold">Supuestos del escenario</h2>
        <p className="mt-1 text-sm text-slate-500">Ajustá los valores para ver el impacto. Los valores por defecto son los de docs/FINANCIAL-MODEL.md.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FIELDS.map((f) => (
            <label key={f.key} className="block text-sm">
              <span className="text-slate-600">{f.label}</span>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  step={f.step}
                  value={f.toInput(params[f.key])}
                  onChange={(e) => update(f.key, f.fromInput(Number(e.target.value)))}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
                {f.suffix && <span className="text-slate-400">{f.suffix}</span>}
              </div>
            </label>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Capital al final del horizonte", last ? money(last.capitalTotal) : "—"],
          ["Múltiplo sobre capital inicial", last ? `${multiplo.toLocaleString("es-UY", { maximumFractionDigits: 2 })}x` : "—"],
          ["Interés total proyectado", money(totalInteres)],
          ["Pérdida esperada total", money(totalPerdida)],
        ].map(([l, v]) => (
          <div key={l} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">{l}</div>
            <div className="mt-2 text-xl font-bold">{v}</div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="font-bold">Capital total proyectado por mes</h2>
        <p className="mt-1 text-sm text-slate-500">Caja disponible + cartera vigente performante, mes a mes.</p>
        <div className="mt-4 space-y-1.5">
          {months.map((m) => (
            <div key={m.mes} className="flex items-center gap-3 text-xs">
              <span className="w-10 shrink-0 text-slate-400">M{m.mes}</span>
              <div className="h-4 flex-1 overflow-hidden rounded bg-slate-100">
                <div
                  className="h-full rounded bg-sky-600"
                  style={{ width: `${Math.max(2, (m.capitalTotal / maxCapital) * 100)}%` }}
                />
              </div>
              <span className="w-28 shrink-0 text-right font-medium">{money(m.capitalTotal)}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold">Detalle mensual</h2>
        <div className="mt-3 max-h-[28rem] overflow-y-auto overflow-x-auto rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-slate-500">
              <tr>{["Mes", "Colocado", "Cobrado", "Interés", "Pérdida esp.", "Caja", "Cartera vigente", "Capital total"].map((x) => <th key={x} className="whitespace-nowrap px-4 py-3 font-medium">{x}</th>)}</tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.mes} className="border-t">
                  <td className="px-4 py-2 font-semibold">{m.mes}</td>
                  <td className="px-4 py-2">{money(m.colocado)}</td>
                  <td className="px-4 py-2">{money(m.cobrado)}</td>
                  <td className="px-4 py-2">{money(m.interesGanado)}</td>
                  <td className="px-4 py-2">{money(m.perdidaEsperada)}</td>
                  <td className="px-4 py-2">{money(m.capitalDisponible)}</td>
                  <td className="px-4 py-2">{money(m.carteraVigente)}</td>
                  <td className="px-4 py-2 font-semibold">{money(m.capitalTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-slate-400">
        Proyección de valor esperado, no una simulación estocástica por préstamo. Tasa ({pct(params.tasaMensual)}% mensual) e
        incobrabilidad ({pct(params.tasaIncobrabilidad)}%) son supuestos de planificación -- ver docs/FINANCIAL-MODEL.md.
        No son tasas autorizadas ni un compromiso de rendimiento real.
      </p>
    </div>
  );
}
