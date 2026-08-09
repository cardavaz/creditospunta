import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { refreshInstallmentStatus } from "@/lib/payments";
import { recordAudit } from "@/lib/audit";

/**
 * Job diario (ver vercel.json) que persiste el pasaje PENDING/PARTIAL -> OVERDUE
 * según la fecha de vencimiento. Hasta ahora esto se calculaba "en vivo" en cada
 * lectura (dashboard, cobranza); este job lo deja también reflejado en la
 * columna Installment.status, para que cualquier consulta directa a la base
 * (reportes externos, un futuro contador/auditor) vea el estado real sin pasar
 * por la lógica de la app.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }
  }

  const installments = await db.installment.findMany({
    where: { status: { not: "PAID" } },
    select: { id: true, amount: true, paidAmount: true, dueDate: true, status: true },
  });

  let updated = 0;
  for (const i of installments) {
    const next = refreshInstallmentStatus(
      { amount: Number(i.amount), paidAmount: Number(i.paidAmount), dueDate: i.dueDate, status: i.status },
    );
    if (next !== i.status) {
      await db.installment.update({ where: { id: i.id }, data: { status: next } });
      updated += 1;
    }
  }

  await recordAudit({
    action: "REFRESH_INSTALLMENT_STATUS",
    entity: "Installment",
    entityId: "batch",
    result: "OK",
    reason: `${updated} de ${installments.length} cuotas actualizadas`,
  });

  return NextResponse.json({ ok: true, checked: installments.length, updated });
}
