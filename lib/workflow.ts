export type ApplicationStatus = "BORRADOR" | "EN_REVISION" | "APROBADA" | "RECHAZADA" | "CANCELADA";
export type LoanStatus = "PENDIENTE_DESEMBOLSO" | "ACTIVO" | "EN_MORA" | "REFINANCIADO" | "INCOBRABLE" | "CERRADO";

export type CreditApplication = {
  id: string;
  clientId: string;
  requestedAmount: number;
  termMonths: number;
  status: ApplicationStatus;
  score?: number;
  decisionReason?: string;
};

export const applicationTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  BORRADOR: ["EN_REVISION", "CANCELADA"],
  EN_REVISION: ["APROBADA", "RECHAZADA", "CANCELADA"],
  APROBADA: [],
  RECHAZADA: [],
  CANCELADA: [],
};

export function canTransitionApplication(from: ApplicationStatus, to: ApplicationStatus) {
  return applicationTransitions[from].includes(to);
}

export function decideApplication(application: CreditApplication, score: number, maxSuggested: number) {
  if (application.status !== "EN_REVISION") throw new Error("La solicitud no está en revisión");
  if (score < 600) return { status: "RECHAZADA" as const, reason: "Score Punta por debajo del umbral de simulación" };
  if (application.requestedAmount > maxSuggested) return { status: "RECHAZADA" as const, reason: "Monto solicitado superior al máximo sugerido" };
  return { status: "APROBADA" as const, reason: "Cumple los criterios experimentales de simulación" };
}

export function loanStatusFromOverdueDays(overdueDays: number): LoanStatus {
  if (overdueDays <= 0) return "ACTIVO";
  return "EN_MORA";
}
