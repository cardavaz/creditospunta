export type AuditEvent = {
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  occurredAt: string;
  result: "OK" | "DENIED" | "ERROR";
  reason?: string;
};

export function createAuditEvent(input: Omit<AuditEvent, "occurredAt">): AuditEvent {
  return { ...input, occurredAt: new Date().toISOString() };
}
