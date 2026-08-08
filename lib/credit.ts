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

export function atlasScore(input: { income: number; requested: number; monthlyPayment: number; employmentYears: number; priorGoodLoans: number; priorLateLoans: number; }): { score: number; risk: "BAJO" | "MEDIO" | "ALTO"; maxSuggested: number } {
  const capacity = input.income > 0 ? input.monthlyPayment / input.income : 1;
  let score = 450;
  score += Math.min(180, Math.max(0, input.income / 500));
  score += Math.min(100, input.employmentYears * 12);
  score += Math.min(120, input.priorGoodLoans * 20);
  score -= Math.min(180, input.priorLateLoans * 45);
  if (capacity <= 0.2) score += 100; else if (capacity <= 0.3) score += 50; else if (capacity > 0.4) score -= 120;
  score = Math.round(Math.max(300, Math.min(900, score)));
  const risk = score >= 750 ? "BAJO" : score >= 600 ? "MEDIO" : "ALTO";
  const maxSuggested = Math.max(0, Math.min(12000, Math.floor(input.income * (risk === "BAJO" ? 0.25 : risk === "MEDIO" ? 0.18 : 0.10))));
  return { score, risk, maxSuggested };
}
