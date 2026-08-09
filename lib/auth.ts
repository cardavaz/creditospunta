import "server-only";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { createSession, destroySession, getSession, type SessionPayload } from "./session";
import type { Role } from "@prisma/client";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export type LoginResult =
  | { ok: true }
  | { ok: false; reason: "invalid" }
  | { ok: false; reason: "locked"; lockedUntil: Date };

/**
 * Verifica credenciales y aplica bloqueo temporal tras intentos fallidos
 * repetidos (protección básica contra fuerza bruta sobre /login).
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !user.active) return { ok: false, reason: "invalid" };

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    return { ok: false, reason: "locked", lockedUntil: user.lockedUntil };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const attempts = user.failedLoginAttempts + 1;
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60_000);
      await db.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil } });
      return { ok: false, reason: "locked", lockedUntil };
    }
    await db.user.update({ where: { id: user.id }, data: { failedLoginAttempts: attempts } });
    return { ok: false, reason: "invalid" };
  }

  if (user.failedLoginAttempts > 0 || user.lockedUntil) {
    await db.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
  }

  const session: SessionPayload = { userId: user.id, email: user.email, name: user.name, role: user.role };
  await createSession(session);
  return { ok: true };
}

export async function logout() {
  await destroySession();
}

/** Devuelve el usuario logueado o null. Usar en server components / server actions. */
export async function getCurrentUser(): Promise<SessionPayload | null> {
  return getSession();
}

/** Lanza si no hay usuario logueado o su rol no está en la lista permitida. */
export async function requireRole(...roles: Role[]): Promise<SessionPayload> {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado.");
  if (!roles.includes(user.role)) throw new Error(`Rol ${user.role} no autorizado para esta acción.`);
  return user;
}
