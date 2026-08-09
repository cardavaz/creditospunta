import { describe, it, expect } from "vitest";
import { calculateLoan, scorePunta } from "./credit";

describe("calculateLoan", () => {
  it("amortiza el balance exactamente a 0 en la última cuota", () => {
    const { schedule } = calculateLoan(10000, 60, 6);
    expect(schedule).toHaveLength(6);
    expect(schedule[schedule.length - 1].balance).toBeCloseTo(0, 6);
  });

  it("el total pagado según el schedule coincide con payment*meses (salvo redondeo de la última cuota)", () => {
    const { schedule, total } = calculateLoan(8000, 60, 6);
    const sum = schedule.reduce((s, r) => s + r.payment, 0);
    expect(sum).toBeCloseTo(total, 6);
  });

  it("interés total = total pagado - capital", () => {
    const { total, interest } = calculateLoan(6000, 60, 3);
    expect(interest).toBeCloseTo(total - 6000, 6);
  });

  it("con tasa 0% el pago es simplemente capital/meses, sin interés", () => {
    const { payment, interest, schedule } = calculateLoan(6000, 0, 6);
    expect(payment).toBeCloseTo(1000, 6);
    expect(interest).toBeCloseTo(0, 6);
    expect(schedule.every((r) => r.interest === 0)).toBe(true);
  });

  it("rechaza parámetros inválidos", () => {
    expect(() => calculateLoan(0, 60, 6)).toThrow();
    expect(() => calculateLoan(1000, 60, 0)).toThrow();
    expect(() => calculateLoan(1000, -1, 6)).toThrow();
  });
});

describe("scorePunta", () => {
  const base = { income: 30000, requested: 8000, monthlyPayment: 2000, employmentYears: 3, priorGoodLoans: 2, priorLateLoans: 0 };

  it("siempre devuelve un score entre 300 y 900", () => {
    const { score } = scorePunta(base);
    expect(score).toBeGreaterThanOrEqual(300);
    expect(score).toBeLessThanOrEqual(900);
  });

  it("siempre devuelve al menos una razón (nunca es una caja negra)", () => {
    const { reasons } = scorePunta(base);
    expect(reasons.length).toBeGreaterThan(0);
  });

  it("un buen perfil (ingresos altos, sin moras) da riesgo BAJO", () => {
    const { risk } = scorePunta({ income: 60000, requested: 6000, monthlyPayment: 1000, employmentYears: 5, priorGoodLoans: 3, priorLateLoans: 0 });
    expect(risk).toBe("BAJO");
  });

  it("moras previas y cuota/ingreso alta empujan el riesgo hacia ALTO", () => {
    const { risk } = scorePunta({ income: 10000, requested: 8000, monthlyPayment: 5000, employmentYears: 0, priorGoodLoans: 0, priorLateLoans: 3 });
    expect(risk).toBe("ALTO");
  });

  it("maxSuggested nunca supera el techo de producto (12000) ni es negativo", () => {
    const { maxSuggested } = scorePunta({ income: 1_000_000, requested: 8000, monthlyPayment: 1000, employmentYears: 10, priorGoodLoans: 10, priorLateLoans: 0 });
    expect(maxSuggested).toBeLessThanOrEqual(12000);
    expect(maxSuggested).toBeGreaterThanOrEqual(0);
  });
});
