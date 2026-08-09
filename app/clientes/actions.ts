"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import type { Prisma } from "@prisma/client";

export async function listClients(query?: string) {
  const where: Prisma.ClientWhereInput = query
    ? {
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { documentNumber: { contains: query, mode: "insensitive" } },
        ],
      }
    : {};

  return db.client.findMany({
    where,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

export type CreateClientState = { error?: string; ok?: boolean };

export async function createClient(_prev: CreateClientState, formData: FormData): Promise<CreateClientState> {
  let actor;
  try {
    actor = await requireRole("ADMIN", "OPERADOR");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No autorizado." };
  }

  const documentNumber = String(formData.get("documentNumber") || "").trim();
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const phone = String(formData.get("phone") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  const monthlyIncomeRaw = String(formData.get("monthlyIncome") || "").trim();
  const employmentYearsRaw = String(formData.get("employmentYears") || "").trim();

  if (!documentNumber || !firstName || !lastName) {
    return { error: "CI, nombre y apellido son obligatorios." };
  }

  const existing = await db.client.findUnique({ where: { documentNumber } });
  if (existing) {
    return { error: "Ya existe un cliente con esa CI." };
  }

  const client = await db.client.create({
    data: {
      documentNumber,
      firstName,
      lastName,
      phone,
      email,
      monthlyIncome: monthlyIncomeRaw ? Number(monthlyIncomeRaw) : null,
      employmentYears: employmentYearsRaw ? Number(employmentYearsRaw) : null,
    },
  });

  await recordAudit({ actorId: actor.userId, action: "CREATE_CLIENT", entity: "Client", entityId: client.id, result: "OK" });

  revalidatePath("/clientes");
  return { ok: true };
}


export async function getClientDetail(id: string) {
  return db.client.findUnique({
    where: { id },
    include: {
      applications: {
        include: { product: true, loan: true },
        orderBy: { createdAt: "desc" },
      },
      loans: {
        include: {
          installments: { orderBy: { number: "asc" }, include: { payments: true } },
          collectionActions: { orderBy: { createdAt: "desc" }, include: { actor: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
