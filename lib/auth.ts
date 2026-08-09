import "server-only";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { createSession, destroySession, getSession, type SessionPayload } from "./session";
import type { Role } from "@prisma/client";

export async function verifyCredentials(email: string, password: string): Promise<SessionPayload | null> {
  const user = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || !user.active) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;
  return { userId: user.id, email: user.email, name: user.name, role: user.role };
}

export async function login(email: string, password: string) {
  const session = await verifyCredentials(email, password);
  if (!session) return false;
  await createSession(session);
  return true;
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
