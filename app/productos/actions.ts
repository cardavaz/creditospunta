"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function listProducts() {
  return db.product.findMany({ orderBy: { minAmount: "asc" } });
}

function parseTerms(raw: string): number[] {
  return raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
}

export type ProductFormState = { error?: string; ok?: boolean };

export async function createProduct(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  let actor;
  try {
    actor = await requireRole("ADMIN");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No autorizado." };
  }

  const name = String(formData.get("name") || "").trim();
  const minAmount = Number(formData.get("minAmount") || 0);
  const maxAmount = Number(formData.get("maxAmount") || 0);
  const terms = parseTerms(String(formData.get("allowedTerms") || ""));

  if (!name) return { error: "El nombre es obligatorio." };
  if (!(minAmount > 0) || !(maxAmount > 0) || minAmount > maxAmount) {
    return { error: "El rango de monto es inválido." };
  }
  if (terms.length === 0) return { error: "Ingresá al menos un plazo en meses (ej: 3,6,9)." };

  const existing = await db.product.findUnique({ where: { name } });
  if (existing) return { error: "Ya existe un producto con ese nombre." };

  const product = await db.product.create({
    data: { name, minAmount, maxAmount, allowedTerms: terms },
  });

  await recordAudit({ actorId: actor.userId, action: "CREATE_PRODUCT", entity: "Product", entityId: product.id, result: "OK" });

  revalidatePath("/productos");
  return { ok: true };
}

export async function updateProduct(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  let actor;
  try {
    actor = await requireRole("ADMIN");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No autorizado." };
  }

  const id = String(formData.get("id") || "");
  const minAmount = Number(formData.get("minAmount") || 0);
  const maxAmount = Number(formData.get("maxAmount") || 0);
  const terms = parseTerms(String(formData.get("allowedTerms") || ""));
  const active = formData.get("active") === "on";

  if (!id) return { error: "Producto inválido." };
  if (!(minAmount > 0) || !(maxAmount > 0) || minAmount > maxAmount) {
    return { error: "El rango de monto es inválido." };
  }
  if (terms.length === 0) return { error: "Ingresá al menos un plazo en meses." };

  await db.product.update({
    where: { id },
    data: { minAmount, maxAmount, allowedTerms: terms, active },
  });

  await recordAudit({ actorId: actor.userId, action: "UPDATE_PRODUCT", entity: "Product", entityId: id, result: "OK" });

  revalidatePath("/productos");
  revalidatePath("/solicitudes");
  return { ok: true };
}
