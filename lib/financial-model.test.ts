import { describe, it, expect } from "vitest";
import { simulateScenario, DEFAULT_SCENARIO } from "./financial-model";

describe("simulateScenario", () => {
  it("devuelve exactamente horizonMeses filas", () => {
    const months = simulateScenario({ ...DEFAULT_SCENARIO, horizonMeses: 12 });
    expect(months).toHaveLength(12);
  });

  it("en el mes 1 el capital total ya refleja la pérdida esperada (no cae a 0 solo por no haber cobrado cuotas todavía)", () => {
    const months = simulateScenario({ ...DEFAULT_SCENARIO, horizonMeses: 3 });
    const expectedMonth1 = DEFAULT_SCENARIO.capitalInicial * (1 - DEFAULT_SCENARIO.tasaIncobrabilidad);
    expect(months[0].capitalTotal).toBeCloseTo(expectedMonth1, 0);
  });

  it("nunca devuelve valores negativos o no finitos", () => {
    const months = simulateScenario(DEFAULT_SCENARIO);
    for (const m of months) {
      for (const v of Object.values(m)) {
        expect(Number.isFinite(v)).toBe(true);
        expect(v).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("con incobrabilidad 0% y tasa 0%, el capital total se mantiene igual al inicial (no se pierde ni se gana nada)", () => {
    const months = simulateScenario({ ...DEFAULT_SCENARIO, tasaIncobrabilidad: 0, tasaMensual: 0, horizonMeses: 12 });
    for (const m of months) {
      expect(m.capitalTotal).toBeCloseTo(DEFAULT_SCENARIO.capitalInicial, 0);
    }
  });

  it("a más incobrabilidad, menor capital proyectado al final del horizonte", () => {
    const low = simulateScenario({ ...DEFAULT_SCENARIO, tasaIncobrabilidad: 0.01, horizonMeses: 12 });
    const high = simulateScenario({ ...DEFAULT_SCENARIO, tasaIncobrabilidad: 0.10, horizonMeses: 12 });
    expect(high[high.length - 1].capitalTotal).toBeLessThan(low[low.length - 1].capitalTotal);
  });

  it("rechaza parámetros inválidos", () => {
    expect(() => simulateScenario({ ...DEFAULT_SCENARIO, capitalInicial: -1 })).toThrow();
    expect(() => simulateScenario({ ...DEFAULT_SCENARIO, montoPromedio: 0 })).toThrow();
    expect(() => simulateScenario({ ...DEFAULT_SCENARIO, plazoMeses: 0 })).toThrow();
    expect(() => simulateScenario({ ...DEFAULT_SCENARIO, horizonMeses: 0 })).toThrow();
  });
});
