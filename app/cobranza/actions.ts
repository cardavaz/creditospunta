"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

const PAGE_SIZE = 50;

/**
 * Cuotas vencidas "en vivo": vencidas por fecha y no pagas, sin depender de un
 * job que actualice el status. Paginado (ver [[creditospunta-repo]]/tarea #31 --
 * este listado se había quedado afuera de esa corrección y tenía el mismo riesgo
 * de romperse bajo carga que los otros). Los totales (monto vencido, casos)
 * se calculan aparte con agregados sobre TODO el conjunto, no solo la página
 * visible.
 */
export async function listOverdueInstallments(page = 1) {
  const skip = (page - 1) * PAGE_SIZE;
  const where = { status: { not: "PAID" as const }, dueDate: { lt: new Date() } };

  const [items, total, totals, distinctLoans] = await Promise.all([
    db.installment.findMany({
      where,
      include: { loan: { include: { client: true } } },
      orderBy: { dueDate: "asc" },
      skip,
      take: PAGE_SIZE,
    }),
    db.installment.count({ where }),
    db.installment.aggregate({ where, _sum: { amount: true, paidAmount: true } }),
    db.installment.findMany({ where, select: { loanId: true }, distinct: ["loanId"] }),
  ]);

  const loanIds = [...new Set(items.map((i) => i.loanId))];
  const lastActions = loanIds.length
    ? await db.collectionAction.findMany({ where: { loanId: { in: loanIds } }, orderBy: { createdAt: "desc" }, distinct: ["loanId"] })
    : [];
  const lastActionByLoan = new Map(lastActions.map((a) => [a.loanId, a]));

  return {
    items: items.map((i) => ({ ...i, lastAction: lastActionByLoan.get(i.loanId) ?? null })),
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    totalOverdueAmount: Number(totals._sum.amount ?? 0) - Number(totals._sum.paidAmount ?? 0),
    cases: distinctLoans.length,
  };
}

export async function listCollectionActions(loanId: string) {
  return db.collectionAction.findMany({ where: { loanId }, orderBy: { createdAt: "desc" } });
}

const CHANNELS = ["CALL", "WHATSAPP", "EMAIL", "VISIT", "OTHER"] as const;
const RESULTS = ["NO_CONTACT", "PROMISE_TO_PAY", "REFUSED", "PAID", "OTHER"] as const;

export type CollectionActionState = { error?: string; ok?: boolean };

export async function registerCollectionAction(_prev: CollectionActionState, formData: FormData): Promise<CollectionActionState> {
  let actor;
  try {
    actor = await requireRole("ADMIN", "COBRANZA");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No autorizado." };
  }

  const loanId = String(formData.get("loanId") || "");
  const installmentId = String(formData.get("installmentId") || "") || null;
  const channelRaw = String(formData.get("channel") || "");
  const resultRaw = String(formData.get("result") || "");
  const promiseDateRaw = String(formData.get("promiseDate") || "");
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!loanId) return { error: "Préstamo inválido." };
  if (!(CHANNELS as readonly string[]).includes(channelRaw)) return { error: "Canal inválido." };
  if (!(RESULTS as readonly string[]).includes(resultRaw)) return { error: "Resultado inválido." };

  const channel = channelRaw as (typeof CHANNELS)[number];
  const result = resultRaw as (typeof RESULTS)[number];
  const promiseDate = result === "PROMISE_TO_PAY" && promiseDateRaw ? new Date(promiseDateRaw) : null;

  const action = await db.collectionAction.create({
    data: { loanId, installmentId, actorId: actor.userId, channel, result, promiseDate, notes },
  });

  await recordAudit({
    actorId: actor.userId,
    action: "REGISTER_COLLECTION_ACTION",
    entity: "Loan",
    entityId: loanId,
    result: "OK",
    reason: `${channel} -> ${result}${notes ? `: ${notes}` : ""}`,
  });

  void action;
  revalidatePath("/cobranza");
  return { ok: true };
}
