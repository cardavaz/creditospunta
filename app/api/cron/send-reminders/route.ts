import { NextResponse } from "next/server";
import { sendDueReminders } from "@/lib/notifications";
import { recordAudit } from "@/lib/audit";

/**
 * Job diario (ver vercel.json) que manda recordatorios de vencimiento por email
 * -- ver lib/notifications.ts para el detalle de las dos ventanas (próxima a
 * vencer / vencida). Corre después de refresh-installments para que el estado
 * OVERDUE ya esté persistido cuando este job lee la tabla.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }
  }

  const result = await sendDueReminders();

  await recordAudit({
    action: "SEND_DUE_REMINDERS",
    entity: "Installment",
    entityId: "batch",
    result: "OK",
    reason: `${result.upcoming} próximas a vencer, ${result.overdue} vencidas, ${result.skippedNoEmail} sin email de contacto`,
  });

  return NextResponse.json({ ok: true, ...result });
}
