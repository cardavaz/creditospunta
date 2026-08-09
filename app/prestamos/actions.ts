"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { applyPayment } from "@/lib/payments";
import { requireRole } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

const PAGE_SIZE = 30;

export async function listLoans(page = 1) {
  const skip = (page - 1) * PAGE_SIZE;
  const [items, total] = await Promise.all([
    db.loan.findMany({
      include: {
        client: true,
        installments: { orderBy: { number: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    db.loan.count(),
  ]);
  return { items, total, page, pageSize: PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export type RegisterPaymentState = { error?: string; ok?: boolean };

const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "CARD", "OTHER"] as const;

export async function registerPayment(_prev: RegisterPaymentState, formData: FormData): Promise<RegisterPaymentState> {
  let actor;
  try {
    actor = await requireRole("ADMIN", "COBRANZA");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No autorizado." };
  }

  const installmentId = String(formData.get("installmentId") || "");
  const amount = Number(formData.get("amount") || 0);
  const methodRaw = String(formData.get("method") || "CASH");
  const reference = String(formData.get("reference") || "").trim() || null;

  if (!installmentId) return { error: "Cuota inválida." };
  if (!(amount > 0)) return { error: "El importe debe ser mayor a 0." };
  if (!(PAYMENT_METHODS as readonly string[]).includes(methodRaw)) return { error: "Método de pago inválido." };
  const method = methodRaw as (typeof PAYMENT_METHODS)[number];

  const installment = await db.installment.findUnique({ where: { id: installmentId } });
  if (!installment) return { error: "Cuota no encontrada." };
  if (installment.status === "PAID") return { error: "Esta cuota ya está paga." };

  const { paidAmount, status } = applyPayment(
    { amount: Number(installment.amount), paidAmount: Number(installment.paidAmount), dueDate: installment.dueDate },
    amount,
  );

  await db.$transaction(async (tx) => {
    await tx.payment.create({
      data: { installmentId, amount, method, reference },
    });
    await tx.installment.update({
      where: { id: installmentId },
      data: { paidAmount, status },
    });

    if (status === "PAID") {
      const pending = await tx.installment.count({
        where: { loanId: installment.loanId, status: { not: "PAID" } },
      });
      if (pending === 0) {
        await tx.loan.update({ where: { id: installment.loanId }, data: { status: "PAID_OFF" } });
      }
    }
  });

  await recordAudit({
    actorId: actor.userId,
    action: "REGISTER_PAYMENT",
    entity: "Installment",
    entityId: installmentId,
    result: "OK",
    reason: `Pago de ${amount} via ${method}`,
  });

  revalidatePath("/prestamos");
  revalidatePath("/");
  return { ok: true };
}
