import "server-only";
import { db } from "./db";
import type { AuditResult } from "@prisma/client";

export type RecordAuditInput = {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  result: AuditResult;
  reason?: string;
};

/**
 * Registra un evento de auditoría persistente (tabla AuditEvent).
 * No debe lanzar: un fallo de auditoría nunca debería tumbar la operación
 * de negocio que la originó, pero sí queda logueado en consola para revisar.
 */
export async function recordAudit(input: RecordAuditInput): Promise<void> {
  try {
    await db.auditEvent.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        result: input.result,
        reason: input.reason,
      },
    });
  } catch (err) {
    console.error("No se pudo registrar el evento de auditoría", input, err);
  }
}
