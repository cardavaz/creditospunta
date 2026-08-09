import { PrismaClient, type Product } from "@prisma/client";
import { calculateLoan, scorePunta } from "../lib/credit";

/**
 * Fase 4 del roadmap: prueba de carga. Genera clientes/solicitudes/préstamos/
 * cuotas/pagos ficticios usando la MISMA lógica de negocio que la app real
 * (calculateLoan/scorePunta), para poder ver cómo se comporta la cartera y
 * las pantallas (dashboard, reportes, cobranza) con volumen real.
 *
 * Todos los registros generados quedan marcados con documentNumber que
 * empieza con "LT-" para poder identificarlos y borrarlos después con
 * seed-load-test-cleanup.ts. NO borra ni toca datos existentes.
 *
 * Uso:
 *   LOAD_TEST_COUNT=1000 npx tsx prisma/seed-load-test.ts
 * (por defecto genera 2000 clientes si no se pasa la variable)
 */

const prisma = new PrismaClient();

const FIRST_NAMES = [
  "María", "Juan", "Lucía", "Martín", "Ana", "Diego", "Valentina", "Federico",
  "Camila", "Nicolás", "Sofía", "Gonzalo", "Florencia", "Andrés", "Paula",
  "Rodrigo", "Belén", "Sebastián", "Micaela", "Agustín", "Carolina", "Bruno",
  "Daniela", "Ignacio", "Julieta", "Matías", "Rocío", "Emiliano", "Victoria", "Franco",
];
const LAST_NAMES = [
  "Rodríguez", "Pérez", "Martínez", "González", "Fernández", "López", "García",
  "Sosa", "Silva", "Pereira", "Rodrigues", "Cabrera", "Correa", "Acosta",
  "Ferreira", "Bentancur", "Machado", "Suárez", "Núñez", "Castro", "Morales",
  "Delgado", "Olivera", "Barreto", "Techera", "Píriz", "Aguirre", "Vidal", "Bonilla", "Ramos",
];
const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "CARD"] as const;
const COLLECTION_CHANNELS = ["CALL", "WHATSAPP", "EMAIL", "VISIT"] as const;
const COLLECTION_RESULTS = ["NO_CONTACT", "PROMISE_TO_PAY", "REFUSED"] as const;

const CLIENT_COUNT = Number(process.env.LOAD_TEST_COUNT ?? 2000);
const CONCURRENCY = 8;

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: readonly T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}
function fakeCI(i: number) {
  return `LT-${String(i).padStart(6, "0")}`;
}

async function createFakeApplication(client: { id: string; monthlyIncome: unknown; employmentYears: unknown }, products: Product[]) {
  const product = pick(products);
  const term = pick(product.allowedTerms) as number;
  const min = Number(product.minAmount);
  const max = Number(product.maxAmount);
  const requestedAmount = randomInt(min, max);
  const annualRate = randomInt(45, 95);
  const calc = calculateLoan(requestedAmount, annualRate, term);

  const priorGoodLoans = randomInt(0, 3);
  const priorLateLoans = randomInt(0, 2);
  const score = scorePunta({
    income: Number(client.monthlyIncome ?? 0),
    requested: requestedAmount,
    monthlyPayment: calc.payment,
    employmentYears: Number(client.employmentYears ?? 0),
    priorGoodLoans,
    priorLateLoans,
  });

  const roll = Math.random();
  const status = roll < 0.05 ? "DRAFT" : roll < 0.1 ? "SUBMITTED" : roll < 0.15 ? "UNDER_REVIEW" : roll < 0.85 ? "APPROVED" : "REJECTED";

  const application = await prisma.loanApplication.create({
    data: {
      clientId: client.id,
      productId: product.id,
      requestedAmount,
      termMonths: term,
      annualRate,
      monthlyPayment: calc.payment,
      scorePunta: score.score,
      riskLevel: score.risk,
      scoreReasons: score.reasons,
      status,
    },
  });

  if (status !== "APPROVED") return;

  const monthsAgo = randomInt(0, 8);
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - monthsAgo);

  const loan = await prisma.loan.create({
    data: {
      clientId: client.id,
      applicationId: application.id,
      principal: requestedAmount,
      annualRate,
      termMonths: term,
      monthlyPayment: calc.payment,
      totalAmount: calc.total,
      interestAmount: calc.interest,
      startDate,
      status: "ACTIVE",
    },
  });

  await prisma.installment.createMany({
    data: calc.schedule.map((row) => ({
      loanId: loan.id,
      number: row.number,
      dueDate: new Date(startDate.getFullYear(), startDate.getMonth() + row.number, startDate.getDate()),
      amount: row.payment,
      status: "PENDING" as const,
    })),
  });

  const installments = await prisma.installment.findMany({ where: { loanId: loan.id }, orderBy: { number: "asc" } });
  const now = new Date();
  let anyUnpaidPast = false;

  for (const inst of installments) {
    if (inst.dueDate > now) continue;
    const payRoll = Math.random();
    if (payRoll < 0.8) {
      await prisma.payment.create({ data: { installmentId: inst.id, amount: inst.amount, method: pick(PAYMENT_METHODS) } });
      await prisma.installment.update({ where: { id: inst.id }, data: { paidAmount: inst.amount, status: "PAID" } });
    } else if (payRoll < 0.92) {
      const partial = Math.round(Number(inst.amount) * (0.3 + Math.random() * 0.5));
      await prisma.payment.create({ data: { installmentId: inst.id, amount: partial, method: pick(PAYMENT_METHODS) } });
      await prisma.installment.update({ where: { id: inst.id }, data: { paidAmount: partial, status: "PARTIAL" } });
      anyUnpaidPast = true;
    } else {
      await prisma.installment.update({ where: { id: inst.id }, data: { status: "OVERDUE" } });
      anyUnpaidPast = true;
      if (Math.random() < 0.5) {
        await prisma.collectionAction.create({
          data: {
            loanId: loan.id,
            installmentId: inst.id,
            channel: pick(COLLECTION_CHANNELS),
            result: pick(COLLECTION_RESULTS),
            notes: "Gestión generada por prueba de carga.",
          },
        });
      }
    }
  }

  const allPastDue = installments.every((i) => i.dueDate <= now);
  if (allPastDue && !anyUnpaidPast) {
    await prisma.loan.update({ where: { id: loan.id }, data: { status: "PAID_OFF" } });
  }
}

async function createFakeClient(i: number, products: Product[]) {
  const client = await prisma.client.create({
    data: {
      documentNumber: fakeCI(i),
      firstName: pick(FIRST_NAMES),
      lastName: pick(LAST_NAMES),
      phone: `09${randomInt(1000000, 9999999)}`,
      email: `loadtest${i}@example.test`,
      monthlyIncome: randomInt(15000, 90000),
      employmentYears: Math.round(Math.random() * 150) / 10,
      status: "ACTIVE",
    },
  });

  const applicationCount = randomInt(1, 3);
  for (let a = 0; a < applicationCount; a++) {
    await createFakeApplication(client, products);
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  const products = await prisma.product.findMany({ where: { active: true } });
  if (products.length === 0) {
    throw new Error("No hay productos activos en la base. Creá al menos uno en /productos antes de correr esto.");
  }

  console.log(`Generando ${CLIENT_COUNT} clientes de prueba de carga (prefijo LT-)...`);
  const indices = Array.from({ length: CLIENT_COUNT }, (_, i) => i + 1);
  let done = 0;

  for (const batch of chunk(indices, CONCURRENCY)) {
    await Promise.all(batch.map((i) => createFakeClient(i, products)));
    done += batch.length;
    if (done % 200 === 0 || done === CLIENT_COUNT) console.log(`  ${done}/${CLIENT_COUNT}`);
  }

  await prisma.auditEvent.create({
    data: {
      action: "LOAD_TEST_SEED",
      entity: "Client",
      entityId: "batch",
      result: "OK",
      reason: `Generados ${CLIENT_COUNT} clientes de prueba (prefijo LT-) via prisma/seed-load-test.ts`,
    },
  });

  console.log("Listo. Para borrar todo esto después: npx tsx prisma/seed-load-test-cleanup.ts");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
