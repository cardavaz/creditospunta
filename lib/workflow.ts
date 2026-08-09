/**
 * Máquina de estados de solicitudes y préstamos.
 * Los valores coinciden exactamente con los enums de prisma/schema.prisma
 * (ApplicationStatus / LoanStatus) para que el motor de workflow y la base
 * de datos nunca queden desincronizados.
 */
export type ApplicationStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "CANCELLED";
export type LoanStatus = "PENDING" | "ACTIVE" | "PAID_OFF" | "DEFAULTED" | "CANCELLED";

export const applicationTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["UNDER_REVIEW", "CANCELLED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: [],
  REJECTED: [],
  CANCELLED: [],
};

export function canTransitionApplication(from: ApplicationStatus, to: ApplicationStatus) {
  return applicationTransitions[from].includes(to);
}

export type ApplicationDecisionInput = {
  status: ApplicationStatus;
  requestedAmount: number;
};

/**
 * Decide una solicitud EN_REVISION en base al resultado de Score Punta.
 * Esto es una recomendación: siempre debe pasar por revisión humana antes
 * de persistirse como decisión final (ver docs/OPERATING-POLICY.md).
 */
export function decideApplication(application: ApplicationDecisionInput, score: number, maxSuggested: number) {
  if (application.status !== "UNDER_REVIEW") throw new Error("La solicitud no está en revisión");
  if (score < 600) return { status: "REJECTED" as const, reason: "Score Punta por debajo del umbral mínimo" };
  if (application.requestedAmount > maxSuggested) return { status: "REJECTED" as const, reason: "Monto solicitado superior al máximo sugerido por Score Punta" };
  return { status: "APPROVED" as const, reason: "Cumple los criterios experimentales de evaluación" };
}
