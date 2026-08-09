"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { calculateLoan, scorePunta } from "@/lib/credit";
import { canTransitionApplication, type ApplicationStatus } from "@/lib/workflow";
import { requireRole } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function listApplications() {
  return db.loanApplication.findMany({
    include: { client: true, loan: true, product: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function listClientsForSelect() {
  return db.client.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ lastName: "asc" }],
    select: { id: true, firstName: true, lastName: true, documentNumber: true, monthlyIncome: true, employmentYears: true },
  });
}

export async function listActiveProducts() {
  return db.product.findMany({ where: { active: true }, orderBy: { minAmount: "asc" } });
}

export type CreateApplicationState = { error?: string; ok?: boolean };

export async function createApplication(_prev: CreateApplicationState, formData: FormData): Promise<CreateApplicationState> {
  let actor;
  try {
    actor = await requireRole("ADMIN", "OPERADOR");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No autorizado." };
  }

  const clientId = String(formData.get("clientId") || "");
  const productId = String(formData.get("productId") || "");
  const requestedAmount = Number(formData.get("requestedAmount") || 0);
  const termMonths = Number(formData.get("termMonths") || 0);
  const annualRate = Number(formData.get("annualRate") || 0);

  if (!clientId) return { error: "Seleccioná un cliente." };
  if (!productId) return { error: "Seleccioná un producto." };
  if (!(requestedAmount > 0)) return { error: "El monto solicitado debe ser mayor a 0." };
  if (!(termMonths > 0)) return { error: "El plazo debe ser mayor a 0." };
  if (annualRate < 0) return { error: "La tasa no puede ser negativa." };

  const client = await db.client.findUnique({ where: { id: clientId } });
  if (!client) return { error: "Cliente no encontrado." };

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product || !product.active) return { error: "Producto no encontrado o inactivo." };
  if (requestedAmount < Number(product.minAmount) || requestedAmount > Number(product.maxAmount)) {
    return { error: `El producto ${product.name} admite entre ${Number(product.minAmount)} y ${Number(product.maxAmount)}.` };
  }
  if (!product.allowedTerms.includes(termMonths)) {
    return { error: `El producto ${product.name} solo permite estos plazos: ${product.allowedTerms.join(", ")}.` };
  }

  const calc = calculateLoan(requestedAmount, annualRate, termMonths);

  const [priorGoodLoans, priorLateLoans] = await Promise.all([
    db.loan.count({ where: { clientId, status: "PAID_OFF" } }),
    db.installment.count({ where: { loan: { clientId }, status: "OVERDUE" } }),
  ]);

  const score = scorePunta({
    income: Number(client.monthlyIncome ?? 0),
    requested: requestedAmount,
    monthlyPayment: calc.payment,
    employmentYears: Number(client.employmentYears ?? 0),
    priorGoodLoans,
    priorLateLoans,
  });

  const application = await db.loanApplication.create({
    data: {
      clientId,
      productId,
      requestedAmount,
      termMonths,
      annualRate,
      monthlyPayment: calc.payment,
      scorePunta: score.score,
      riskLevel: score.risk,
      status: "UNDER_REVIEW",
    },
  });

  await recordAudit({
    actorId: actor.userId,
    action: "CREATE_APPLICATION",
    entity: "LoanApplication",
    entityId: application.id,
    result: "OK",
    reason: `Score Punta ${score.score} (${score.risk}): ${score.reasons.join("; ")}`,
  });

  revalidatePath("/solicitudes");
  return { ok: true };
}

export type DecisionState = { error?: string; ok?: boolean };

export async function decideApplicationAction(_prev: DecisionState, formData: FormData): Promise<DecisionState> {
  let actor;
  try {
    actor = await requireRole("ADMIN", "RIESGO");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No autorizado." };
  }

  const applicationId = String(formData.get("applicationId") || "");
  const decision = String(formData.get("decision") || "") as ApplicationStatus;
  const reason = String(formData.get("reason") || "").trim();

  if (decision !== "APPROVED" && decision !== "REJECTED") return { error: "Decisión inválida." };

  const application = await db.loanApplication.findUnique({ where: { id: applicationId } });
  if (!application) return { error: "Solicitud no encontrada." };

  const currentStatus = application.status as ApplicationStatus;
  if (!canTransitionApplication(currentStatus, decision)) {
    return { error: `No se puede pasar de ${currentStatus} a ${decision}.` };
  }

  if (decision === "REJECTED") {
    await db.loanApplication.update({
      where: { id: applicationId },
      data: { status: "REJECTED", notes: reason || application.notes },
    });
    await recordAudit({
      actorId: actor.userId,
      action: "REJECT_APPLICATION",
      entity: "LoanApplication",
      entityId: applicationId,
      result: "OK",
      reason: reason || undefined,
    });
    revalidatePath("/solicitudes");
    return { ok: true };
  }

  // APPROVED: decisión humana explícita. Genera préstamo + cuotas en una transacción.
  const calc = calculateLoan(Number(application.requestedAmount), Number(application.annualRate), application.termMonths);
  const startDate = new Date();

  await db.$transaction(async (tx) => {
    await tx.loanApplication.update({
      where: { id: applicationId },
      data: { status: "APPROVED", notes: reason || application.notes },
    });
    const loan = await tx.loan.create({
      data: {
        clientId: application.clientId,
        applicationId: application.id,
        principal: application.requestedAmount,
        annualRate: application.annualRate,
        termMonths: application.termMonths,
        monthlyPayment: calc.payment,
        totalAmount: calc.total,
        interestAmount: calc.interest,
        startDate,
        status: "ACTIVE",
      },
    });
    await tx.installment.createMany({
      data: calc.schedule.map((row) => ({
        loanId: loan.id,
        number: row.number,
        dueDate: new Date(startDate.getFullYear(), startDate.getMonth() + row.number, startDate.getDate()),
        amount: row.payment,
        status: "PENDING" as const,
      })),
    });
  });

  await recordAudit({
    actorId: actor.userId,
    action: "APPROVE_APPLICATION",
    entity: "LoanApplication",
    entityId: applicationId,
    result: "OK",
    reason: reason || undefined,
  });

  revalidatePath("/solicitudes");
  revalidatePath("/prestamos");
  revalidatePath("/");
  return { ok: true };
}
