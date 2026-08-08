export type ScoreInput={monthlyIncome:number; monthlyDebt:number; employmentMonths:number; paymentHistory:number; previousLoans:number; requestedAmount:number};
export type ScoreResult={score:number; category:"LOW_RISK"|"MEDIUM_RISK"|"HIGH_RISK"; maxSuggestedAmount:number; debtRatio:number; reasons:string[]};
export function calculateAtlasScore(input:ScoreInput):ScoreResult{let score=500; const reasons:string[]=[]; const debtRatio=input.monthlyIncome>0?(input.monthlyDebt/input.monthlyIncome)*100:100;
 if(debtRatio<=20){score+=120;reasons.push("Endeudamiento bajo")}else if(debtRatio<=35){score+=60;reasons.push("Endeudamiento moderado")}else{score-=100;reasons.push("Endeudamiento elevado")}
 if(input.employmentMonths>=24){score+=100;reasons.push("Antigüedad laboral sólida")}else if(input.employmentMonths>=6){score+=50;reasons.push("Antigüedad laboral aceptable")}else{score-=50;reasons.push("Poca antigüedad laboral")}
 score += Math.max(-100,Math.min(100,input.paymentHistory));
 if(input.paymentHistory>=80)reasons.push("Buen historial de pagos"); else if(input.paymentHistory<0)reasons.push("Historial de pagos desfavorable");
 score += Math.min(80,input.previousLoans*10);
 if(input.requestedAmount>input.monthlyIncome*0.3){score-=80;reasons.push("Monto solicitado alto frente al ingreso")}
 score=Math.max(300,Math.min(900,Math.round(score))); const category=score>=750?"LOW_RISK":score>=600?"MEDIUM_RISK":"HIGH_RISK"; const multiplier=category==="LOW_RISK"?0.3:category==="MEDIUM_RISK"?0.2:0.1;
 return {score,category,maxSuggestedAmount:Math.round(input.monthlyIncome*multiplier),debtRatio:Math.round(debtRatio*10)/10,reasons};}
