export type AmortizationRow = { number: number; payment: number; interest: number; principal: number; balance: number };

export function calculateLoan(principal: number, annualRatePercent: number, months: number): { payment: number; total: number; interest: number; schedule: AmortizationRow[] } {
  if (principal <= 0 || months <= 0 || annualRatePercent < 0) throw new Error("Parámetros inválidos");
  const monthlyRate = annualRatePercent / 100 / 12;
  const payment = monthlyRate === 0 ? principal / months : principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
  let balance = principal;
  const schedule: AmortizationRow[] = [];
  for (let i = 1; i <= months; i++) {
    const interest = balance * monthlyRate;
    const principalPart = i === months ? balance : payment - interest;
    balance = Math.max(0, balance - principalPart);
    schedule.push({ number: i, payment: i === months ? principalPart + interest : payment, interest, principal: principalPart, balance });
  }
  const total = schedule.reduce((s, x) => s + x.payment, 0);
  return { payment, total, interest: total - principal, schedule };
}

export type ScorePuntaInput = { income: number; requested: number; monthlyPayment: number; employmentYears: number; priorGoodLoans: number; priorLateLoans: number };
export type ScorePuntaResult = { score: number; risk: "BAJO" | "MEDIO" | "ALTO"; maxSuggested: number; reasons: string[] };

/**
 * Score Punta: modelo experimental de apoyo a decisiones. No sustituye revisión
 * humana ni reglas regulatorias. Devuelve `reasons` para que la decisión sea
 * explicable (ver docs/OPERATING-POLICY.md): nunca debe ser una caja negra.
 */
export function scorePunta(input: ScorePuntaInput): ScorePuntaResult {
  const reasons: string[] = [];
  const capacity = input.income > 0 ? input.monthlyPayment / input.income : 1;
  let score = 450;

  const incomePoints = Math.min(180, Math.max(0, input.income / 500));
  score += incomePoints;
  reasons.push(`Ingresos: +${Math.round(incomePoints)}`);

  const tenurePoints = Math.min(100, input.employmentYears * 12);
  score += tenurePoints;
  reasons.push(`Antigüedad laboral: +${Math.round(tenurePoints)}`);

  const goodLoanPoints = Math.min(120, input.priorGoodLoans * 20);
  score += goodLoanPoints;
  if (goodLoanPoints > 0) reasons.push(`Historial positivo (${input.priorGoodLoans} préstamo(s) pagados): +${Math.round(goodLoanPoints)}`);

  const latePenalty = Math.min(180, input.priorLateLoans * 45);
  score -= latePenalty;
  if (latePenalty > 0) reasons.push(`Moras anteriores (${input.priorLateLoans}): -${Math.round(latePenalty)}`);

  if (capacity <= 0.2) { score += 100; reasons.push("Relación cuota/ingreso baja: +100"); }
  else if (capacity <= 0.3) { score += 50; reasons.push("Relación cuota/ingreso moderada: +50"); }
  else if (capacity > 0.4) { score -= 120; reasons.push("Relación cuota/ingreso alta: -120"); }

  score = Math.round(Math.max(300, Math.min(900, score)));
  const risk = score >= 750 ? "BAJO" : score >= 600 ? "MEDIO" : "ALTO";
  const maxSuggested = Math.max(0, Math.min(12000, Math.floor(input.income * (risk === "BAJO" ? 0.25 : risk === "MEDIO" ? 0.18 : 0.10))));
  return { score, risk, maxSuggested, reasons };
}

