import "server-only";
import { db } from "./db";
import { sendEmail } from "./email";

const DAYS_BEFORE_DUE = 3;
const OVERDUE_RESEND_DAYS = 7;

function money(n: number) {
  return n.toLocaleString("es-UY", { style: "currency", currency: "UYU", maximumFractionDigits: 0 });
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("es-UY", { day: "numeric", month: "long" });
}

/**
 * Recordatorios de vencimiento por email (Fase 3 del roadmap). Dos casos:
 *  - Próxima a vencer: cuota PENDING que vence en los próximos DAYS_BEFORE_DUE días
 *    y todavía no se le mandó recordatorio.
 *  - Vencida: cuota OVERDUE, recordada como mucho una vez cada OVERDUE_RESEND_DAYS
 *    días (para no spamear todos los días la misma cuota vencida).
 * Usa el mismo lib/email.ts que password-reset -- si no hay RESEND_API_KEY
 * configurada, el envío queda logueado en vez de salir de verdad, así que este
 * job es seguro de correr ya mismo en staging sin mandar emails reales a nadie.
 */
export async function sendDueReminders(): Promise<{ upcoming: number; overdue: number; skippedNoEmail: number }> {
  const now = new Date();
  const soon = new Date(now.getTime() + DAYS_BEFORE_DUE * 86_400_000);
  const resendCutoff = new Date(now.getTime() - OVERDUE_RESEND_DAYS * 86_400_000);

  const [upcomingInstallments, overdueInstallments] = await Promise.all([
    db.installment.findMany({
      where: { status: "PENDING", dueDate: { gte: now, lte: soon }, lastReminderAt: null },
      include: { loan: { include: { client: true } } },
    }),
    db.installment.findMany({
      where: { status: "OVERDUE", OR: [{ lastReminderAt: null }, { lastReminderAt: { lt: resendCutoff } }] },
      include: { loan: { include: { client: true } } },
    }),
  ]);

  let upcoming = 0;
  let overdue = 0;
  let skippedNoEmail = 0;

  for (const i of upcomingInstallments) {
    const client = i.loan.client;
    if (!client.email) { skippedNoEmail++; continue; }
    const balance = Number(i.amount) - Number(i.paidAmount);
    await sendEmail({
      to: client.email,
      subject: `Tu cuota vence el ${fmtDate(i.dueDate)} · CréditosPunta`,
      html: `<p>Hola ${client.firstName},</p><p>Te recordamos que la cuota N° ${i.number} de tu préstamo vence el <strong>${fmtDate(i.dueDate)}</strong> por ${money(balance)}.</p><p>Si ya la pagaste, ignorá este mensaje.</p>`,
      text: `Hola ${client.firstName}, tu cuota N° ${i.number} vence el ${fmtDate(i.dueDate)} por ${money(balance)}.`,
    });
    await db.installment.update({ where: { id: i.id }, data: { lastReminderAt: now } });
    upcoming++;
  }

  for (const i of overdueInstallments) {
    const client = i.loan.client;
    if (!client.email) { skippedNoEmail++; continue; }
    const balance = Number(i.amount) - Number(i.paidAmount);
    await sendEmail({
      to: client.email,
      subject: `Cuota vencida · CréditosPunta`,
      html: `<p>Hola ${client.firstName},</p><p>La cuota N° ${i.number} de tu préstamo, con vencimiento el ${fmtDate(i.dueDate)}, está pendiente de pago por ${money(balance)}.</p><p>Contactanos para coordinar el pago.</p>`,
      text: `Hola ${client.firstName}, la cuota N° ${i.number} (vencimiento ${fmtDate(i.dueDate)}) está pendiente por ${money(balance)}.`,
    });
    await db.installment.update({ where: { id: i.id }, data: { lastReminderAt: now } });
    overdue++;
  }

  return { upcoming, overdue, skippedNoEmail };
}
