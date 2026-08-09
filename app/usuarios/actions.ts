"use server";

import { revalidatePath } from "next/cache";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import type { Role } from "@prisma/client";

const ROLES: Role[] = ["ADMIN", "OPERADOR", "RIESGO", "COBRANZA", "CONSULTA"];

export async function listUsers() {
  return db.user.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] });
}

function generatePassword() {
  return crypto.randomBytes(9).toString("base64").replace(/[+/=]/g, "").slice(0, 12);
}

export type CreateUserState = { error?: string; ok?: boolean; generatedPassword?: string; createdEmail?: string };

export async function createUser(_prev: CreateUserState, formData: FormData): Promise<CreateUserState> {
  let actor;
  try {
    actor = await requireRole("ADMIN");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No autorizado." };
  }

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "") as Role;

  if (!email || !name) return { error: "Email y nombre son obligatorios." };
  if (!ROLES.includes(role)) return { error: "Rol inválido." };

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "Ya existe un usuario con ese email." };

  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await db.user.create({ data: { email, name, role, passwordHash } });

  await recordAudit({ actorId: actor.userId, action: "CREATE_USER", entity: "User", entityId: user.id, result: "OK", reason: `Rol ${role}` });

  revalidatePath("/usuarios");
  return { ok: true, generatedPassword: password, createdEmail: email };
}

export type SimpleState = { error?: string; ok?: boolean };

export async function toggleUserActive(_prev: SimpleState, formData: FormData): Promise<SimpleState> {
  let actor;
  try {
    actor = await requireRole("ADMIN");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No autorizado." };
  }
  const userId = String(formData.get("userId") || "");
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "Usuario no encontrado." };
  if (target.id === actor.userId) return { error: "No podés desactivar tu propio usuario." };

  const active = !target.active;
  await db.user.update({
    where: { id: userId },
    data: { active, ...(active ? { failedLoginAttempts: 0, lockedUntil: null } : {}) },
  });
  await recordAudit({ actorId: actor.userId, action: active ? "ACTIVATE_USER" : "DEACTIVATE_USER", entity: "User", entityId: userId, result: "OK" });
  revalidatePath("/usuarios");
  return { ok: true };
}

export async function unlockUser(_prev: SimpleState, formData: FormData): Promise<SimpleState> {
  let actor;
  try {
    actor = await requireRole("ADMIN");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No autorizado." };
  }
  const userId = String(formData.get("userId") || "");
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "Usuario no encontrado." };

  await db.user.update({ where: { id: userId }, data: { failedLoginAttempts: 0, lockedUntil: null } });
  await recordAudit({ actorId: actor.userId, action: "UNLOCK_USER", entity: "User", entityId: userId, result: "OK" });
  revalidatePath("/usuarios");
  return { ok: true };
}

export async function changeUserRole(_prev: SimpleState, formData: FormData): Promise<SimpleState> {
  let actor;
  try {
    actor = await requireRole("ADMIN");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No autorizado." };
  }
  const userId = String(formData.get("userId") || "");
  const role = String(formData.get("role") || "") as Role;
  if (!ROLES.includes(role)) return { error: "Rol inválido." };

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "Usuario no encontrado." };
  if (target.id === actor.userId && role !== "ADMIN") {
    return { error: "No podés quitarte el rol de ADMIN a vos mismo." };
  }

  await db.user.update({ where: { id: userId }, data: { role } });
  await recordAudit({ actorId: actor.userId, action: "CHANGE_USER_ROLE", entity: "User", entityId: userId, result: "OK", reason: `Nuevo rol: ${role}` });
  revalidatePath("/usuarios");
  return { ok: true };
}
