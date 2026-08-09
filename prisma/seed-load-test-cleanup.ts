import { PrismaClient } from "@prisma/client";

/**
 * Borra todos los registros generados por prisma/seed-load-test.ts
 * (identificados por Client.documentNumber que empieza con "LT-").
 * No toca ningún otro dato.
 *
 * Uso: npx tsx prisma/seed-load-test-cleanup.ts
 */

const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.client.findMany({
    where: { documentNumber: { startsWith: "LT-" } },
    select: { id: true },
  });
  const clientIds = clients.map((c) => c.id);

  if (clientIds.length === 0) {
    console.log("No hay datos de prueba de carga para borrar.");
    return;
  }

  const loans = await prisma.loan.findMany({ where: { clientId: { in: clientIds } }, select: { id: true } });
  const loanIds = loans.map((l) => l.id);

  const installments = await prisma.installment.findMany({ where: { loanId: { in: loanIds } }, select: { id: true } });
  const installmentIds = installments.map((i) => i.id);

  console.log(`Borrando ${clientIds.length} clientes de prueba y todo lo relacionado...`);

  await prisma.payment.deleteMany({ where: { installmentId: { in: installmentIds } } });
  await prisma.collectionAction.deleteMany({ where: { loanId: { in: loanIds } } });
  await prisma.installment.deleteMany({ where: { loanId: { in: loanIds } } });
  await prisma.loan.deleteMany({ where: { id: { in: loanIds } } });
  await prisma.loanApplication.deleteMany({ where: { clientId: { in: clientIds } } });
  await prisma.client.deleteMany({ where: { id: { in: clientIds } } });

  await prisma.auditEvent.create({
    data: {
      action: "LOAD_TEST_CLEANUP",
      entity: "Client",
      entityId: "batch",
      result: "OK",
      reason: `Borrados ${clientIds.length} clientes de prueba (prefijo LT-) y datos relacionados`,
    },
  });

  console.log("Listo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
