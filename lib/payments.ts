/**
 * Motor de pagos y mora. Los estados coinciden con InstallmentStatus de
 * prisma/schema.prisma (PENDING/PARTIAL/PAID/OVERDUE).
 */
export type InstallmentStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";

export function overdueDays(dueDate: Date | string, today: Date = new Date()): number {
  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  return Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86400000));
}

/**
 * Calcula el nuevo importe pagado y estado de una cuota tras aplicar un pago.
 * No muta nada: la persistencia queda a cargo de quien llama (server action).
 */
export function applyPayment(installment: { amount: number; paidAmount: number; dueDate: Date | string }, paymentAmount: number, today: Date = new Date()) {
  if (paymentAmount <= 0) throw new Error("El importe del pago debe ser mayor a 0");
  const paidAmount = Math.min(installment.amount, installment.paidAmount + paymentAmount);
  const status: InstallmentStatus =
    paidAmount >= installment.amount ? "PAID" : overdueDays(installment.dueDate, today) > 0 ? "OVERDUE" : "PARTIAL";
  return { paidAmount, status };
}

/** Recalcula el estado de una cuota sin pago nuevo (por ejemplo, en un job diario). */
export function refreshInstallmentStatus(installment: { amount: number; paidAmount: number; dueDate: Date | string; status: InstallmentStatus }, today: Date = new Date()): InstallmentStatus {
  if (installment.status === "PAID") return "PAID";
  if (installment.paidAmount > 0 && installment.paidAmount < installment.amount) {
    return overdueDays(installment.dueDate, today) > 0 ? "OVERDUE" : "PARTIAL";
  }
  return overdueDays(installment.dueDate, today) > 0 ? "OVERDUE" : "PENDING";
}
