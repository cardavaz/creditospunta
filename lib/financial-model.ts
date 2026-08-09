import { calculateLoan } from "./credit";

/**
 * Simulador de escenarios de capital (Fase 5 del roadmap). Puramente ilustrativo:
 * ver docs/FINANCIAL-MODEL.md -- ninguna tasa acá es una tasa autorizada ni un
 * compromiso real, es una proyección determinística de valor esperado para
 * ayudar a decidir cuánto capital destinar y qué mezcla de plazo/tasa/incobrabilidad
 * sostiene el negocio.
 *
 * Modelo: cada mes se originan tantos préstamos de `montoPromedio` como alcance
 * la caja disponible (reinvirtiendo lo cobrado). Cada préstamo se trata como una
 * mezcla de una porción "performante" (1 - tasaIncobrabilidad) que amortiza
 * normalmente (reutilizando el mismo motor de amortización que /solicitudes) y
 * una porción que se pierde íntegramente -- valor esperado, no una simulación
 * aleatoria por préstamo.
 */

export type ScenarioParams = {
  capitalInicial: number;
  montoPromedio: number;
  tasaMensual: number; // fracción, ej. 0.05 = 5% mensual
  plazoMeses: number;
  tasaIncobrabilidad: number; // fracción, ej. 0.02 = 2%
  horizonMeses: number;
};

export type ScenarioMonth = {
  mes: number;
  colocado: number;
  cobrado: number;
  interesGanado: number;
  perdidaEsperada: number;
  capitalDisponible: number;
  carteraVigente: number;
  capitalTotal: number; // capitalDisponible + carteraVigente (performante)
};

export const DEFAULT_SCENARIO: ScenarioParams = {
  capitalInicial: 240000, // "Cartera inicial" de docs/FINANCIAL-MODEL.md (los $60.000 restantes son reserva + legal + software)
  montoPromedio: 8000, // promedio del catálogo de productos ($4k-$12k)
  tasaMensual: 0.05,
  plazoMeses: 6,
  tasaIncobrabilidad: 0.02,
  horizonMeses: 24,
};

export function simulateScenario(p: ScenarioParams): ScenarioMonth[] {
  if (p.capitalInicial < 0 || p.montoPromedio <= 0 || p.plazoMeses <= 0 || p.horizonMeses <= 0) {
    throw new Error("Parámetros de escenario inválidos");
  }
  const annualRatePercent = p.tasaMensual * 12 * 100;
  const performingFraction = Math.max(0, 1 - p.tasaIncobrabilidad);

  type Cohort = { startMonth: number; principalPerformante: number; schedule: ReturnType<typeof calculateLoan>["schedule"] };
  const cohorts: Cohort[] = [];
  const months: ScenarioMonth[] = [];

  let cash = p.capitalInicial;

  for (let m = 1; m <= p.horizonMeses; m++) {
    let colocadoMes = 0;
    let perdidaMes = 0;
    let guard = 0;
    while (cash >= p.montoPromedio && guard < 2000) {
      guard++;
      const principalPerformante = p.montoPromedio * performingFraction;
      const { schedule } = calculateLoan(Math.max(1, principalPerformante), annualRatePercent, p.plazoMeses);
      cohorts.push({ startMonth: m, principalPerformante, schedule });
      cash -= p.montoPromedio;
      colocadoMes += p.montoPromedio;
      perdidaMes += p.montoPromedio * p.tasaIncobrabilidad;
    }

    let cobradoMes = 0;
    let interesMes = 0;
    let carteraVigente = 0;
    for (const c of cohorts) {
      const idx = m - c.startMonth; // número de cuota (1-indexado) que cae en este mes; 0 = recién originado, sin pagos aún
      if (idx === 0) {
        // Originado este mes: todavía no hubo pago, el saldo pendiente es el principal performante completo.
        carteraVigente += c.principalPerformante;
        continue;
      }
      if (idx >= 1 && idx <= c.schedule.length) {
        const row = c.schedule[idx - 1];
        cobradoMes += row.payment;
        interesMes += row.interest;
        carteraVigente += row.balance;
      }
    }
    cash += cobradoMes;

    months.push({
      mes: m,
      colocado: colocadoMes,
      cobrado: cobradoMes,
      interesGanado: interesMes,
      perdidaEsperada: perdidaMes,
      capitalDisponible: cash,
      carteraVigente,
      capitalTotal: cash + carteraVigente,
    });
  }

  return months;
}
