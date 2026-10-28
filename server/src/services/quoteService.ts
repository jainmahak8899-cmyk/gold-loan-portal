import { GOLD_RATE_24K, LOAN_SCHEMES } from "../config";
import type { QuoteRequest } from "../schemas/leadSchema";

export interface QuoteResult {
  schemeId: string;
  schemeName: string;
  pureGoldGrams: number;
  goldValue: number;
  eligibleLoan: number;
  interestRatePA: number;
  tenureMonths: number;
  emi: number | null;
  totalInterest: number;
  totalRepayment: number;
  effectiveLtv: number;
  goldRate24k: number;
}

export function computeQuote(params: {
  netWeightGrams: number;
  karat: 18 | 22 | 24;
  schemeId: string;
}): QuoteResult {
  const scheme = LOAN_SCHEMES.find((s) => s.id === params.schemeId);
  if (!scheme) throw new Error(`Invalid scheme: ${params.schemeId}`);

  const pureGoldGrams = params.netWeightGrams * (params.karat / 24);
  const goldValue = pureGoldGrams * GOLD_RATE_24K;
  const effectiveLtv = Math.min(scheme.maxLtv, 0.75);
  const eligibleLoan = Math.floor(goldValue * effectiveLtv);

  const monthlyRate = scheme.interestRatePA / 100 / 12;
  const n = scheme.tenureMonths;

  let emi: number | null = null;
  let totalInterest: number;
  let totalRepayment: number;

  if (scheme.id === "emi") {
    // Standard EMI formula: P * r * (1+r)^n / ((1+r)^n - 1)
    emi = Math.ceil(
      (eligibleLoan * monthlyRate * Math.pow(1 + monthlyRate, n)) /
        (Math.pow(1 + monthlyRate, n) - 1)
    );
    totalRepayment = emi * n;
    totalInterest = totalRepayment - eligibleLoan;
  } else {
    // Bullet: simple interest for 12 months
    totalInterest = Math.round(eligibleLoan * (scheme.interestRatePA / 100));
    totalRepayment = eligibleLoan + totalInterest;
  }

  return {
    schemeId: scheme.id,
    schemeName: scheme.name,
    pureGoldGrams: parseFloat(pureGoldGrams.toFixed(4)),
    goldValue: Math.round(goldValue),
    eligibleLoan,
    interestRatePA: scheme.interestRatePA,
    tenureMonths: scheme.tenureMonths,
    emi,
    totalInterest,
    totalRepayment,
    effectiveLtv,
    goldRate24k: GOLD_RATE_24K,
  };
}

export function maskMobile(mobile: string): string {
  // 9876543210 → 9876XXXX10
  return mobile.slice(0, 4) + "XXXX" + mobile.slice(-2);
}

export function generateApplicationId(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `GL-${date}-${suffix}`;
}
