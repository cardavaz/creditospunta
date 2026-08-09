"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

/** Cuotas vencidas "en vivo": vencidas por fecha y no pagas, sin depender de un job que actualice el status. */
export async function listOverdueInstallments() {
  const installments = await db.installment.findMany({
    where: {
      status: { not: "PAID" },
      dueDate: { lt: new Date() },
    },
    include: {
      loan: { include: { client: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  const loanIds = [...new Set(installments.map((i) => i.loanId))];
  const lastActions = await db.collectionAction.findMany({
    where: { loanId: { in: loanIds } },
    orderBy: { createdAt: "desc" },
    distinct: ["loanId"],
  });
  const lastActionByLoan = new Map(lastActions.map((a) => [a.loanId, a]));

  return installments.map((i) => ({ ...i, lastAction: lastActionByLoan.get(i.loanId) ?? null }));
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
