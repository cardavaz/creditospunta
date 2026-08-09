import { describe, it, expect } from "vitest";
import { overdueDays, applyPayment, refreshInstallmentStatus } from "./payments";

describe("overdueDays", () => {
  it("es 0 para una fecha futura", () => {
    const future = new Date("2026-09-01");
    expect(overdueDays(future, new Date("2026-08-01"))).toBe(0);
  });

  it("es 0 el mismo día del vencimiento", () => {
    const due = new Date("2026-08-01T00:00:00");
    expect(overdueDays(due, due)).toBe(0);
  });

  it("cuenta los días completos transcurridos desde el vencimiento", () => {
    const due = new Date("2026-08-01T00:00:00");
    const today = new Date("2026-08-05T00:00:00");
    expect(overdueDays(due, today)).toBe(4);
  });
});

describe("applyPayment", () => {
  const installment = { amount: 1000, paidAmount: 0, dueDate: new Date("2026-08-01") };

  it("marca PAID cuando el pago cubre el saldo completo", () => {
    const { paidAmount, status } = applyPayment(installment, 1000, new Date("2026-07-15"));
    expect(paidAmount).toBe(1000);
    expect(status).toBe("PAID");
  });

  it("no deja que paidAmount supere el monto de la cuota (cap en overpago)", () => {
    const { paidAmount, status } = applyPayment(installment, 5000, new Date("2026-07-15"));
    expect(paidAmount).toBe(1000);
    expect(status).toBe("PAID");
  });

  it("un pago parcial antes del vencimiento queda PARTIAL", () => {
    const { paidAmount, status } = applyPayment(installment, 400, new Date("2026-07-15"));
    expect(paidAmount).toBe(400);
    expect(status).toBe("PARTIAL");
  });

  it("un pago parcial después del vencimiento queda OVERDUE", () => {
    const { status } = applyPayment(installment, 400, new Date("2026-08-10"));
    expect(status).toBe("OVERDUE");
  });

  it("rechaza pagos con importe <= 0", () => {
    expect(() => applyPayment(installment, 0)).toThrow();
    expect(() => applyPayment(installment, -100)).toThrow();
  });
});

describe("refreshInstallmentStatus", () => {
  const dueDate = new Date("2026-08-01");

  it("una cuota PAID nunca cambia de estado", () => {
    const status = refreshInstallmentStatus({ amount: 1000, paidAmount: 1000, dueDate, status: "PAID" }, new Date("2026-12-01"));
    expect(status).toBe("PAID");
  });

  it("PENDING con vencimiento futuro sigue PENDING", () => {
    const status = refreshInstallmentStatus({ amount: 1000, paidAmount: 0, dueDate, status: "PENDING" }, new Date("2026-07-01"));
    expect(status).toBe("PENDING");
  });

  it("PENDING con vencimiento pasado pasa a OVERDUE", () => {
    const status = refreshInstallmentStatus({ amount: 1000, paidAmount: 0, dueDate, status: "PENDING" }, new Date("2026-08-15"));
    expect(status).toBe("OVERDUE");
  });

  it("pago parcial + vencimiento pasado pasa a OVERDUE (no se queda en PARTIAL)", () => {
    const status = refreshInstallmentStatus({ amount: 1000, paidAmount: 300, dueDate, status: "PARTIAL" }, new Date("2026-08-15"));
    expect(status).toBe("OVERDUE");
  });

  it("pago parcial + vencimiento futuro se mantiene PARTIAL", () => {
    const status = refreshInstallmentStatus({ amount: 1000, paidAmount: 300, dueDate, status: "PARTIAL" }, new Date("2026-07-15"));
    expect(status).toBe("PARTIAL");
  });
});
