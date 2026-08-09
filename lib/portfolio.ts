import type { LoanStatus } from "./workflow";

export type PortfolioLoan = {
  principal: number;
  outstanding: number;
  overdue: number;
  status: LoanStatus;
};

export function portfolioMetrics(loans: PortfolioLoan[]) {
  const placed = loans.reduce((s, l) => s + l.principal, 0);
  const outstanding = loans.reduce((s, l) => s + l.outstanding, 0);
  const overdue = loans.reduce((s, l) => s + l.overdue, 0);
  const active = loans.filter((l) => l.status === "ACTIVE" || l.status === "PENDING").length;
  return { placed, outstanding, overdue, active, delinquencyRate: outstanding ? overdue / outstanding : 0 };
}
